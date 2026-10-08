import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { s as cn } from "./types-BGbzMcaj.mjs";
import { D as Copy, S as Image$1, a as Trash2, j as Camera, w as ExternalLink } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Button, p as useI18n } from "./router-BxAYLhzp.mjs";
import { t as require_jsQR } from "../_libs/jsqr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scan-8vUDdrTg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_jsQR = /* @__PURE__ */ __toESM(require_jsQR());
function Card({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("rounded-2xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]", className),
		...props
	});
}
var HISTORY_KEY = "nibras-scan-history";
function loadHistory() {
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function saveHistory(items) {
	localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 40)));
}
function decodeCanvas(canvas) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;
	const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
	return (0, import_jsQR.default)(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}
function Scanner() {
	const { t } = useI18n();
	const videoRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const [live, setLive] = (0, import_react.useState)(false);
	const [result, setResult] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const raf = (0, import_react.useRef)(0);
	const streamRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setHistory(loadHistory());
		return () => stop();
	}, []);
	const pushHit = (text) => {
		setResult(text);
		setHistory((prev) => {
			const next = [{
				text,
				at: Date.now()
			}, ...prev.filter((h) => h.text !== text)];
			saveHistory(next);
			return next;
		});
	};
	const loop = () => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas || video.readyState < 2) {
			raf.current = requestAnimationFrame(loop);
			return;
		}
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.drawImage(video, 0, 0);
			const text = decodeCanvas(canvas);
			if (text) {
				pushHit(text);
				stop();
				return;
			}
		}
		raf.current = requestAnimationFrame(loop);
	};
	const start = async () => {
		setError(null);
		setResult(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: "environment" } },
				audio: false
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
			setLive(true);
			raf.current = requestAnimationFrame(loop);
		} catch {
			setError(t.scan.denied);
		}
	};
	const stop = () => {
		cancelAnimationFrame(raf.current);
		streamRef.current?.getTracks().forEach((tr) => tr.stop());
		streamRef.current = null;
		setLive(false);
	};
	const onFile = async (file) => {
		const url = URL.createObjectURL(file);
		try {
			const img = new Image();
			await new Promise((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject();
				img.src = url;
			});
			const canvas = canvasRef.current;
			if (!canvas) return;
			canvas.width = img.width;
			canvas.height = img.height;
			canvas.getContext("2d")?.drawImage(img, 0, 0);
			const text = decodeCanvas(canvas);
			if (text) pushHit(text);
			else toast.error(t.scan.empty);
		} finally {
			URL.revokeObjectURL(url);
		}
	};
	const isUrl = result && /^https?:\/\//i.test(result);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-[1.1fr_0.9fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative overflow-hidden rounded-xl bg-bg-subtle",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							ref: videoRef,
							className: cn("aspect-[3/4] w-full object-cover sm:aspect-video", !live && "hidden"),
							playsInline: true,
							muted: true
						}),
						!live && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex aspect-[3/4] flex-col items-center justify-center gap-3 text-muted sm:aspect-video",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-6 text-center text-sm",
								children: t.scan.empty
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
							ref: canvasRef,
							className: "hidden"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: stop,
						children: t.scan.stop
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => void start(),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {}),
							" ",
							t.scan.start
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "cursor-pointer",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, {}),
								" ",
								t.scan.gallery,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: "image/*",
									className: "hidden",
									onChange: (e) => {
										const f = e.target.files?.[0];
										if (f) onFile(f);
									}
								})
							]
						})
					})]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-danger",
					children: error
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wide text-muted uppercase",
					children: t.scan.result
				}), result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "break-all font-mono text-sm",
						children: result
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => {
								navigator.clipboard.writeText(result);
								toast.success(t.export.copied);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}),
								" ",
								t.scan.copy
							]
						}), isUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: result,
								target: "_blank",
								rel: "noreferrer",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {}),
									" ",
									t.scan.open
								]
							})
						})]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: t.scan.empty
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-wide text-muted uppercase",
						children: t.scan.history
					}), history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "text-xs text-muted hover:text-fg",
						onClick: () => {
							setHistory([]);
							saveHistory([]);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1 inline size-3" }), t.scan.clear]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: history.slice(0, 12).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "w-full truncate rounded-lg px-2 py-2 text-left font-mono text-xs text-muted hover:bg-bg-subtle hover:text-fg",
						onClick: () => setResult(h.text),
						children: h.text
					}) }, h.at))
				})]
			})]
		})]
	});
}
function ScanMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative size-28",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-2 border-l-2 border-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-2 border-r-2 border-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-0 bottom-0 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-primary" })
		]
	});
}
function ScanPage() {
	const { t } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-4 py-6 md:py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mb-6 font-display text-2xl font-semibold",
			children: t.scan.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scanner, {})]
	});
}
//#endregion
export { ScanPage as component };
