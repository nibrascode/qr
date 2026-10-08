import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as useNavigate, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as PLAN_LIMITS, i as FRAME_STYLES, n as DOT_STYLES, o as QR_TYPES, r as EYE_STYLES, s as cn } from "./types-BGbzMcaj.mjs";
import { i as destinationFor, r as defaultName, t as buildPayload } from "./scan-B50Qo_0M.mjs";
import { C as Globe, M as Calendar, O as Contact, P as AppWindow, _ as MessageCircle, b as Lock, g as MessageSquare, n as Upload, p as Phone, r as Type, t as Wifi, v as MapPin, y as Mail } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { h as useCurrentUserState, i as Button, p as useI18n } from "./router-BxAYLhzp.mjs";
import { n as useGenerator } from "./store-B-OznkgU.mjs";
import { t as QrPreview } from "./preview-DI4PgOun.mjs";
import { n as Input, r as Label, t as ExportBar } from "./export-bar-DxNFHtOD.mjs";
import { r as getProfile, s as saveQr } from "./qr-CcMR0d0O.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-DDoBwd4B.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-24 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70", className),
		...props
	});
}
var ICONS = {
	url: Globe,
	text: Type,
	phone: Phone,
	email: Mail,
	whatsapp: MessageCircle,
	wifi: Wifi,
	vcard: Contact,
	location: MapPin,
	sms: MessageSquare,
	event: Calendar,
	app: AppWindow
};
function Field({ id, label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), children]
	});
}
function TypePicker() {
	const { t } = useI18n();
	const type = useGenerator((s) => s.type);
	const setType = useGenerator((s) => s.setType);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6",
		children: QR_TYPES.map((id) => {
			const Icon = ICONS[id];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setType(id),
				className: cn("flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs transition-colors", type === id ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-bg-elevated text-muted hover:text-fg"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), t.types[id]]
			}, id);
		})
	});
}
function TypeForm() {
	const { t } = useI18n();
	const type = useGenerator((s) => s.type);
	const fields = useGenerator((s) => s.fields);
	const setField = useGenerator((s) => s.setField);
	const f = (key, props) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
		id: key,
		label: t.fields[key] ?? key,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id: key,
			value: fields[key] ?? "",
			onChange: (e) => setField(key, e.target.value),
			...props
		})
	});
	switch (type) {
		case "url": return f("url", {
			placeholder: "https://",
			inputMode: "url"
		});
		case "text": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			id: "text",
			label: t.fields.text,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				id: "text",
				value: fields.text ?? "",
				onChange: (e) => setField("text", e.target.value),
				rows: 5
			})
		});
		case "phone": return f("phone", {
			inputMode: "tel",
			placeholder: "+994"
		});
		case "email": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				f("email", { type: "email" }),
				f("subject"),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "body",
					label: t.fields.body,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: "body",
						value: fields.body ?? "",
						onChange: (e) => setField("body", e.target.value)
					})
				})
			]
		});
		case "whatsapp": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [f("phone", {
				inputMode: "tel",
				placeholder: "99450..."
			}), f("text")]
		});
		case "wifi": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				f("ssid"),
				f("password", { type: "text" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "encryption",
					label: t.fields.encryption,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						id: "encryption",
						value: fields.encryption ?? "WPA",
						onChange: (e) => setField("encryption", e.target.value),
						className: "h-11 w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "WPA",
								children: "WPA/WPA2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "WEP",
								children: "WEP"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "nopass",
								children: "Open"
							})
						]
					})
				})
			]
		});
		case "vcard": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [
				f("firstName"),
				f("lastName"),
				f("org"),
				f("title"),
				f("phone", { inputMode: "tel" }),
				f("email", { type: "email" }),
				f("url", { inputMode: "url" }),
				f("city")
			]
		});
		case "location": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [
				f("lat", { placeholder: "40.4093" }),
				f("lng", { placeholder: "49.8671" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sm:col-span-2",
					children: f("query")
				})
			]
		});
		case "sms": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [f("phone", { inputMode: "tel" }), f("text")]
		});
		case "event": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				f("title"),
				f("start", { type: "datetime-local" }),
				f("end", { type: "datetime-local" }),
				f("location"),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					id: "description",
					label: t.fields.description,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: "description",
						value: fields.description ?? "",
						onChange: (e) => setField("description", e.target.value)
					})
				})
			]
		});
		case "app": return f("url", { placeholder: "https://apps.apple.com/..." });
		default: return null;
	}
}
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors", "data-[state=checked]:bg-primary data-[state=unchecked]:bg-bg-subtle", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-fg transition-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-primary-fg" })
	});
}
function Color({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-center justify-between gap-3 rounded-xl bg-bg-subtle px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] text-subtle",
				children: value
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "color",
				value,
				onChange: (e) => onChange(e.target.value),
				className: "size-8 cursor-pointer rounded-md border border-border bg-transparent"
			})]
		})]
	});
}
function Lockable({ locked, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative", locked && "opacity-70"),
		children: [children, locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute top-0 right-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3 text-muted" })
		})]
	});
}
var DOT_LABEL = {
	square: "square",
	rounded: "rounded",
	dots: "dotsStyle",
	classy: "classy",
	"extra-rounded": "extra"
};
var EYE_LABEL = {
	square: "square",
	rounded: "rounded",
	dots: "dotsStyle",
	leaf: "leaf",
	"extra-rounded": "extra"
};
var FRAME_LABEL = {
	none: "none",
	quiet: "quiet",
	banner: "banner",
	scanme: "scanme",
	ticket: "ticket"
};
function Designer({ canPro, onLocked }) {
	const { t } = useI18n();
	const design = useGenerator((s) => s.design);
	const setDesign = useGenerator((s) => s.setDesign);
	const gate = (ok, patch) => {
		if (!ok) {
			onLocked();
			return;
		}
		setDesign(patch);
	};
	const readFile = (file, key) => {
		if (!canPro) {
			onLocked();
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") setDesign({ [key]: reader.result });
		};
		reader.readAsDataURL(file);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
				children: t.design.colors
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Color, {
						label: t.design.foreground,
						value: design.fg,
						onChange: (fg) => setDesign({
							fg,
							...design.eyeColorMatch ? { eyeColor: fg } : {}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Color, {
						label: t.design.background,
						value: design.bg,
						onChange: (bg) => setDesign({ bg })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lockable, {
						locked: !canPro,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between gap-3 py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: t.design.transparent
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: design.transparent,
								onCheckedChange: (v) => gate(canPro, { transparent: v })
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lockable, {
						locked: !canPro,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between gap-3 py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: t.design.gradient
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: design.gradientEnabled,
								onCheckedChange: (v) => gate(canPro, { gradientEnabled: v })
							})]
						})
					}),
					design.gradientEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Color, {
							label: "A",
							value: design.gradientFrom,
							onChange: (gradientFrom) => setDesign({ gradientFrom })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Color, {
							label: "B",
							value: design.gradientTo,
							onChange: (gradientTo) => setDesign({ gradientTo })
						})]
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
				children: t.design.dots
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-5 gap-1.5",
				children: DOT_STYLES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => gate(s === "square" || canPro, { dotStyle: s }),
					className: cn("h-10 rounded-lg border text-[10px]", design.dotStyle === s ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted"),
					children: t.design[DOT_LABEL[s]]
				}, s))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
				children: t.design.eyes
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-5 gap-1.5",
				children: EYE_STYLES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => gate(s === "square" || canPro, { eyeStyle: s }),
					className: cn("h-10 rounded-lg border text-[10px]", design.eyeStyle === s ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted"),
					children: t.design[EYE_LABEL[s]]
				}, s))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Lockable, {
				locked: !canPro,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
						children: t.design.logo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted hover:text-fg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }),
							"PNG / SVG",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/*",
								className: "hidden",
								onChange: (e) => {
									const file = e.target.files?.[0];
									if (file) readFile(file, "logoDataUrl");
								}
							})
						]
					}),
					design.logoDataUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-2 text-xs text-muted underline",
						onClick: () => setDesign({ logoDataUrl: null }),
						children: t.design.none
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
					children: t.design.frame
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-5 gap-1.5",
					children: FRAME_STYLES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => gate(s === "none" || canPro, { frame: s }),
						className: cn("h-10 rounded-lg border text-[10px]", design.frame === s ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted"),
						children: t.design[FRAME_LABEL[s]]
					}, s))
				}),
				design.frame !== "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Color, {
						label: t.design.frame,
						value: design.frameColor,
						onChange: (frameColor) => setDesign({ frameColor })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "frameText",
							children: t.design.scanText
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "frameText",
							value: design.frameText,
							maxLength: 16,
							onChange: (e) => setDesign({ frameText: e.target.value })
						})]
					})]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Lockable, {
				locked: !canPro,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
					children: t.design.bgImage
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted hover:text-fg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }),
						"JPG / PNG",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "image/*",
							className: "hidden",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) readFile(file, "backgroundImage");
							}
						})
					]
				})]
			})
		]
	});
}
function CreatePage() {
	const { t } = useI18n();
	const navigate = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const gen = useGenerator();
	const [saving, setSaving] = (0, import_react.useState)(false);
	const plan = useQuery({
		queryKey: ["profile"],
		queryFn: () => getProfile(),
		enabled: Boolean(user)
	}).data?.plan ?? "free";
	const limits = PLAN_LIMITS[plan];
	const payload = (0, import_react.useMemo)(() => buildPayload(gen.type, gen.fields), [gen.type, gen.fields]);
	const destination = (0, import_react.useMemo)(() => destinationFor(gen.type, gen.fields), [gen.type, gen.fields]);
	const [origin, setOrigin] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		setOrigin(window.location.origin);
	}, []);
	const previewValue = (0, import_react.useMemo)(() => {
		if (gen.isDynamic && gen.shortCode && origin) return `${origin}/r/${gen.shortCode}`;
		return payload;
	}, [
		gen.isDynamic,
		gen.shortCode,
		origin,
		payload
	]);
	const goUpgrade = () => {
		navigate({ to: "/pricing" });
	};
	const onToggleDynamic = (v) => {
		if (!v) {
			gen.setDynamic(false);
			return;
		}
		if (!user) {
			navigate({ to: "/login" });
			return;
		}
		if (!limits.dynamic) {
			goUpgrade();
			return;
		}
		gen.setDynamic(true);
	};
	const onSave = async () => {
		if (!user) {
			navigate({ to: "/login" });
			return;
		}
		if (gen.isDynamic && !limits.dynamic) {
			goUpgrade();
			return;
		}
		setSaving(true);
		try {
			const saved = await saveQr({ data: {
				id: gen.editingId ?? void 0,
				name: gen.name.trim() || defaultName(gen.type, gen.fields),
				qrType: gen.type,
				isDynamic: gen.isDynamic,
				payload: gen.fields,
				destination: destination || payload,
				design: gen.design
			} });
			gen.loadSaved({
				id: saved.id,
				type: saved.qrType,
				name: saved.name,
				isDynamic: saved.isDynamic,
				fields: saved.payload,
				design: saved.design,
				shortCode: saved.shortCode
			});
			toast.success(t.create.saved);
			if (saved.isDynamic) navigate({
				to: "/dashboard/$id",
				params: { id: saved.id }
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : t.create.needPremium;
			toast.error(msg);
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-6 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-6 flex flex-wrap items-end justify-between gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: t.create.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: t.create.empty
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypePicker, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem_16rem]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-4 rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)] md:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeForm, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "qr-name",
									children: t.fields.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "qr-name",
									value: gen.name,
									onChange: (e) => gen.setName(e.target.value),
									placeholder: defaultName(gen.type, gen.fields)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3 rounded-xl bg-bg-subtle px-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: t.create.dynamic
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted",
									children: t.create.dynamicHint
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: gen.isDynamic,
									onCheckedChange: onToggleDynamic
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: () => void onSave(),
								disabled: saving || isPending,
								children: gen.editingId ? t.create.update : t.create.save
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "lg:sticky lg:top-20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrPreview, {
							value: previewValue,
							design: gen.design,
							branded: limits.branded
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportBar, {
								value: previewValue,
								design: gen.design,
								name: gen.name || defaultName(gen.type, gen.fields),
								plan,
								onLocked: goUpgrade
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)] md:p-5 xl:block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-4 font-display text-sm font-semibold",
							children: t.design.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Designer, {
							canPro: limits.designPro,
							onLocked: goUpgrade
						})]
					})
				]
			}),
			!user && !isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-sm text-muted",
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
export { CreatePage as component };
