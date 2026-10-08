import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as useNavigate, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as PLAN_LIMITS, u as formatNumber } from "./types-BGbzMcaj.mjs";
import { t as buildPayload } from "./scan-B50Qo_0M.mjs";
import { N as ArrowLeft } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as Skeleton, d as RedirectToSignIn, f as LOCALE, h as useCurrentUserState, i as Button, p as useI18n, r as Route$2 } from "./router-BxAYLhzp.mjs";
import { n as useGenerator } from "./store-B-OznkgU.mjs";
import { t as QrPreview } from "./preview-DI4PgOun.mjs";
import { n as Input, r as Label, t as ExportBar } from "./export-bar-DxNFHtOD.mjs";
import { a as getQrStats, i as getQr, r as getProfile, s as saveQr } from "./qr-CcMR0d0O.mjs";
import { t as Badge } from "./badge-CtmSQOfN.mjs";
import { a as Bar, i as CartesianGrid, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard._id-D9gBigMK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function QrDetailPage() {
	const { id } = Route$2.useParams();
	const { t, lang } = useI18n();
	const locale = LOCALE[lang];
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const loadSaved = useGenerator((s) => s.loadSaved);
	const qrQuery = useQuery({
		queryKey: ["qr", id],
		queryFn: () => getQr({ data: id }),
		enabled: Boolean(user)
	});
	const statsQuery = useQuery({
		queryKey: ["qr-stats", id],
		queryFn: () => getQrStats({ data: id }),
		enabled: Boolean(user) && Boolean(qrQuery.data?.isDynamic)
	});
	const profileQuery = useQuery({
		queryKey: ["profile"],
		queryFn: () => getProfile(),
		enabled: Boolean(user)
	});
	const qr = qrQuery.data;
	const [dest, setDest] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (qr) setDest(qr.destination);
	}, [qr]);
	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const value = (0, import_react.useMemo)(() => {
		if (!qr) return "https://nibrascode.com";
		if (qr.isDynamic) return `${origin}/r/${qr.shortCode}`;
		return buildPayload(qr.qrType, qr.payload);
	}, [qr, origin]);
	const saveDest = useMutation({
		mutationFn: async () => {
			if (!qr) return;
			return saveQr({ data: {
				id: qr.id,
				name: qr.name,
				qrType: qr.qrType,
				isDynamic: qr.isDynamic,
				payload: qr.payload,
				destination: dest,
				design: qr.design,
				folderId: qr.folderId
			} });
		},
		onSuccess: () => {
			toast.success(t.create.saved);
			qc.invalidateQueries({ queryKey: ["qr", id] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Error")
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-6xl px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-48" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (qrQuery.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-6xl px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64" })
	});
	if (!qr) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-xl px-4 py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: t.public.missing
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/dashboard",
				children: t.dash.title
			})
		})]
	});
	const plan = profileQuery.data?.plan ?? "free";
	const stats = statsQuery.data;
	const series = stats?.series ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-6 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/dashboard",
				className: "inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }),
					" ",
					t.dash.title
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: qr.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => {
						loadSaved({
							id: qr.id,
							type: qr.qrType,
							name: qr.name,
							isDynamic: qr.isDynamic,
							fields: qr.payload,
							design: qr.design,
							shortCode: qr.shortCode
						});
						navigate({ to: "/create" });
					},
					children: t.dash.edit
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrPreview, {
						value,
						design: qr.design,
						branded: PLAN_LIMITS[plan].branded
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportBar, {
							value,
							design: qr.design,
							name: qr.name,
							plan,
							onLocked: () => void navigate({ to: "/pricing" })
						})
					}),
					qr.isDynamic && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 break-all font-mono text-[11px] text-subtle",
						children: [
							origin,
							"/r/",
							qr.shortCode
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						qr.isDynamic && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "dest",
								children: t.stats.dest
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-col gap-2 sm:flex-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "dest",
									value: dest,
									onChange: (e) => setDest(e.target.value)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									onClick: () => saveDest.mutate(),
									disabled: saveDest.isPending,
									children: t.stats.saveDest
								})]
							})]
						}),
						qr.isDynamic && PLAN_LIMITS[plan].stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: t.stats.total,
										value: formatNumber(stats?.total ?? qr.scanCount, locale)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: t.stats.week,
										value: formatNumber(stats?.last7 ?? 0, locale)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: t.stats.month,
										value: formatNumber(stats?.last30 ?? 0, locale)
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-medium",
									children: t.stats.series
								}), series.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-6 text-sm text-muted",
									children: t.stats.empty
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 h-56",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
										width: "100%",
										height: "100%",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
											data: series,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
													stroke: "#262a32",
													vertical: false
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
													dataKey: "day",
													tick: {
														fill: "#8b929c",
														fontSize: 11
													}
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
													allowDecimals: false,
													tick: {
														fill: "#8b929c",
														fontSize: 11
													}
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
													background: "#12141a",
													border: "1px solid #262a32",
													borderRadius: 12
												} }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
													dataKey: "count",
													fill: "#2dd4bf",
													radius: [
														6,
														6,
														0,
														0
													]
												})
											]
										})
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 md:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-medium",
										children: t.stats.devices
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-3 space-y-2 text-sm",
										children: (stats?.devices ?? []).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex justify-between text-muted",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "capitalize",
												children: d.device
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "tabular-nums text-fg",
												children: d.count
											})]
										}, d.device))
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-medium",
										children: t.stats.countries
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-3 space-y-2 text-sm",
										children: (stats?.countries ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex justify-between text-muted",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.country }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "tabular-nums text-fg",
												children: c.count
											})]
										}, c.country))
									})]
								})]
							})
						] }),
						qr.isDynamic && !PLAN_LIMITS[plan].stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-2xl bg-bg-elevated p-5 text-sm text-muted shadow-[var(--shadow-border)]",
							children: [t.create.needPremium, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								className: "mt-4",
								size: "sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/pricing",
									children: t.common.upgrade
								})
							})]
						})
					]
				})]
			})
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-2xl font-semibold tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { QrDetailPage as component };
