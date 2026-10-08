import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as buildPayload } from "./scan-B50Qo_0M.mjs";
import { E as Download, t as Wifi } from "../_libs/lucide-react.mjs";
import { i as Button, n as Route$1 } from "./router-BxAYLhzp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/r._code-pGkDwCFw.js
var import_jsx_runtime = require_jsx_runtime();
function PublicQrPage() {
	const data = Route$1.useLoaderData();
	if (data.kind === "missing") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-md px-4 py-24 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl font-semibold",
			children: "QR tapılmadı"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "This code is missing or expired."
		})]
	});
	if (data.kind === "inactive") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-md px-4 py-24 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl font-semibold",
			children: data.name
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "Bu QR müvəqqəti dayandırılıb."
		})]
	});
	const qr = data.qr;
	const payload = qr.destination || buildPayload(qr.qrType, qr.payload);
	if (qr.qrType === "wifi") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-md px-4 py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl bg-bg-elevated p-6 text-center shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { className: "mx-auto size-8 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 font-display text-xl font-semibold",
					children: qr.payload.ssid
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Wi-Fi"
				}),
				qr.payload.password && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 font-mono text-lg",
					children: qr.payload.password
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-6",
					onClick: () => void navigator.clipboard.writeText(qr.payload.password ?? ""),
					children: "Şifrəni kopyala"
				})
			]
		})
	});
	if (qr.qrType === "vcard") {
		const vcf = buildPayload("vcard", qr.payload);
		const href = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-md px-4 py-16 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "font-display text-xl font-semibold",
					children: [
						qr.payload.firstName,
						" ",
						qr.payload.lastName
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: qr.payload.org
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href,
						download: "contact.vcf",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), " Kontaktı yüklə"]
					})
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-md px-4 py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-semibold",
				children: qr.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 break-all font-mono text-sm text-muted",
				children: payload
			}),
			/^https?:\/\//i.test(payload) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: payload,
					children: "Keçidi aç"
				})
			})
		]
	});
}
//#endregion
export { PublicQrPage as component };
