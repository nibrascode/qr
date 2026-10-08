import { S as useNavigate, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { s as cn } from "./types-BGbzMcaj.mjs";
import { k as Check } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { h as useCurrentUserState, i as Button, p as useI18n } from "./router-BxAYLhzp.mjs";
import { c as setPlan, r as getProfile } from "./qr-CcMR0d0O.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pricing-Dk5aJOv3.js
var import_jsx_runtime = require_jsx_runtime();
function PricingPage() {
	const { t } = useI18n();
	const navigate = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const qc = useQueryClient();
	const current = useQuery({
		queryKey: ["profile"],
		queryFn: () => getProfile(),
		enabled: Boolean(user)
	}).data?.plan ?? "free";
	const activate = async (plan) => {
		if (!user) {
			navigate({ to: "/login" });
			return;
		}
		try {
			await setPlan({ data: plan });
			await qc.invalidateQueries({ queryKey: ["profile"] });
			toast.success(t.pricing.current);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		}
	};
	const plans = [
		{
			id: "free",
			name: t.pricing.free,
			price: "0",
			items: [
				t.pricing.f1,
				t.pricing.f2,
				t.pricing.f3,
				t.pricing.f4
			],
			cta: t.pricing.ctaFree
		},
		{
			id: "premium",
			name: t.pricing.premium,
			price: "9",
			items: [
				t.pricing.p1,
				t.pricing.p2,
				t.pricing.p3,
				t.pricing.p4,
				t.pricing.p5,
				t.pricing.p6,
				t.pricing.p7
			],
			cta: t.pricing.ctaPremium
		},
		{
			id: "business",
			name: t.pricing.business,
			price: "29",
			items: [
				t.pricing.b1,
				t.pricing.b2,
				t.pricing.b3,
				t.pricing.b4,
				t.pricing.b5
			],
			cta: t.pricing.ctaBusiness
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "max-w-2xl font-display text-3xl font-semibold tracking-tight",
				children: t.pricing.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl text-sm text-muted",
				children: t.pricing.note
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-4 md:grid-cols-3",
				children: plans.map((p) => {
					const active = current === p.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: cn("flex flex-col rounded-2xl bg-bg-elevated p-6 shadow-[var(--shadow-border)]", p.id === "premium" && "ring-1 ring-primary/40"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg font-semibold",
								children: p.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 font-display text-4xl font-semibold tabular-nums",
								children: [
									"$",
									p.price,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-normal text-muted",
										children: t.pricing.month
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-6 flex-1 space-y-2.5",
								children: p.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-2 text-sm text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-4 shrink-0 text-primary" }), item]
								}, item))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "mt-8",
								variant: p.id === "premium" ? "default" : "outline",
								disabled: active || isPending,
								onClick: () => void activate(p.id),
								children: active ? t.pricing.current : p.cta
							})
						]
					}, p.id);
				})
			}),
			!user && !isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-center text-sm text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "text-primary underline-offset-4 hover:underline",
					children: t.nav.signIn
				})
			})
		]
	});
}
//#endregion
export { PricingPage as component };
