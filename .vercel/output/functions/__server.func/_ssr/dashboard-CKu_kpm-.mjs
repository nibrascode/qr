import { S as useNavigate, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { l as formatDate, u as formatNumber } from "./types-BGbzMcaj.mjs";
import { t as buildPayload } from "./scan-B50Qo_0M.mjs";
import { D as Copy, T as Ellipsis, a as Trash2, f as Play, m as Pause } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as Skeleton, c as DropdownMenuItem, d as RedirectToSignIn, f as LOCALE, h as useCurrentUserState, i as Button, l as DropdownMenuTrigger, o as DropdownMenu, p as useI18n, s as DropdownMenuContent } from "./router-BxAYLhzp.mjs";
import { t as QrPreview } from "./preview-DI4PgOun.mjs";
import { l as setQrActive, n as duplicateQr, o as listQr, t as deleteQr } from "./qr-CcMR0d0O.mjs";
import { t as Badge } from "./badge-CtmSQOfN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-CKu_kpm-.js
var import_jsx_runtime = require_jsx_runtime();
function DashboardPage() {
	const { t, lang } = useI18n();
	const locale = LOCALE[lang];
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const list = useQuery({
		queryKey: ["qr-list"],
		queryFn: () => listQr(),
		enabled: Boolean(user)
	});
	const dup = useMutation({
		mutationFn: (id) => duplicateQr({ data: id }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-list"] })
	});
	const toggle = useMutation({
		mutationFn: (input) => setQrActive({ data: input }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-list"] })
	});
	const remove = useMutation({
		mutationFn: (id) => deleteQr({ data: id }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-list"] })
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" })
			]
		})]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const items = list.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-6 md:py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: t.dash.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/create",
					children: t.nav.create
				})
			})]
		}), list.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" })]
		}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-16 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: t.dash.empty
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/create",
					children: t.nav.create
				})
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: items.map((qr) => {
				const value = qr.isDynamic ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${qr.shortCode}` : buildPayload(qr.qrType, qr.payload);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-20 shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrPreview, {
								value: value || "https://nibrascode.com",
								design: qr.design,
								className: "p-1.5"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/dashboard/$id",
										params: { id: qr.id },
										className: "truncate font-display text-sm font-semibold hover:text-primary",
										children: qr.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "rounded-md p-1.5 text-muted hover:bg-bg-subtle hover:text-fg",
											"aria-label": "More",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
										align: "end",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
												onSelect: () => void navigate({
													to: "/dashboard/$id",
													params: { id: qr.id }
												}),
												children: t.dash.edit
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => dup.mutate(qr.id),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }),
													" ",
													t.dash.duplicate
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
												onSelect: () => toggle.mutate({
													id: qr.id,
													active: !qr.isActive
												}),
												children: qr.isActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-3.5" }),
													" ",
													t.dash.pause
												] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }),
													" ",
													t.dash.resume
												] })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												className: "text-danger",
												onSelect: () => {
													if (confirm(t.dash.delete + "?")) remove.mutate(qr.id);
												},
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }),
													" ",
													t.dash.delete
												]
											})
										]
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex flex-wrap gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t.types[qr.qrType] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: qr.isDynamic ? "primary" : "muted",
											children: qr.isDynamic ? t.dash.dynamic : t.dash.static
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: qr.isActive ? "muted" : "danger",
											children: qr.isActive ? t.dash.active : t.dash.paused
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs text-muted tabular-nums",
									children: [
										formatNumber(qr.scanCount, locale),
										" ",
										t.dash.scans,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mx-1.5 text-subtle",
											children: "·"
										}),
										formatDate(qr.createdAt, locale)
									]
								})
							]
						})]
					})
				}, qr.id);
			})
		})]
	});
}
//#endregion
export { DashboardPage as component };
