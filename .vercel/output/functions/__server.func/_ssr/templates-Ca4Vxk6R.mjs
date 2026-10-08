import { S as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as PLAN_LIMITS } from "./types-BGbzMcaj.mjs";
import { t as buildPayload } from "./scan-B50Qo_0M.mjs";
import { b as Lock } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentUserState, i as Button, p as useI18n } from "./router-BxAYLhzp.mjs";
import { n as useGenerator, t as TEMPLATES } from "./store-B-OznkgU.mjs";
import { t as QrPreview } from "./preview-DI4PgOun.mjs";
import { r as getProfile } from "./qr-CcMR0d0O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/templates-Ca4Vxk6R.js
var import_jsx_runtime = require_jsx_runtime();
function TemplatesPage() {
	const { t } = useI18n();
	const navigate = useNavigate();
	const { user } = useCurrentUserState();
	const applyTemplate = useGenerator((s) => s.applyTemplate);
	const plan = useQuery({
		queryKey: ["profile"],
		queryFn: () => getProfile(),
		enabled: Boolean(user)
	}).data?.plan ?? "free";
	const canPro = PLAN_LIMITS[plan].designPro;
	const labels = {
		wifi: t.templates.wifi,
		restaurant: t.templates.restaurant,
		business: t.templates.business,
		social: t.templates.social,
		contact: t.templates.contact,
		event: t.templates.event,
		payment: t.templates.payment,
		whatsapp: t.templates.whatsapp
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-6 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: t.templates.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: t.templates.body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: TEMPLATES.map((tpl) => {
					const locked = tpl.premium && !canPro;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "flex flex-col rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto w-full max-w-[180px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrPreview, {
									value: buildPayload(tpl.type, tpl.fields),
									design: tpl.design
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-sm font-semibold",
									children: labels[tpl.id] ?? tpl.id
								}), tpl.premium && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 text-[10px] text-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3" }), t.common.locked]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "mt-3",
								variant: locked ? "outline" : "secondary",
								onClick: () => {
									if (locked) {
										navigate({ to: "/pricing" });
										return;
									}
									applyTemplate(tpl.id);
									navigate({ to: "/create" });
								},
								children: t.templates.use
							})
						]
					}, tpl.id);
				})
			})
		]
	});
}
//#endregion
export { TemplatesPage as component };
