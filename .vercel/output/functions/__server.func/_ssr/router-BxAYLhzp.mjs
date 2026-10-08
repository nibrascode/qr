import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useRouter, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, p as useRouterState, v as createFileRoute, x as Navigate, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Slot, o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn, s as __exportAll } from "./ssr.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { i as signOut, t as authClient } from "./client-1vAx-gM_.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { s as cn } from "./types-BGbzMcaj.mjs";
import { o as resolveScan } from "./scan-B50Qo_0M.mjs";
import { a as hasGateSessionMarker, n as auth } from "./server-BAyciUy3.mjs";
import { d as QrCode, i as TriangleAlert, l as Shapes, o as Sparkles, u as ScanLine, x as LayoutGrid } from "../_libs/lucide-react.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { a as Trigger, i as Root2, n as Item2, r as Portal2, t as Content2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-current-user-BYyFvsCd.js
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-B2Izd0c7.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-BxAYLhzp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var LANGS = [
	{
		id: "az",
		label: "AZ",
		native: "Azərbaycan"
	},
	{
		id: "ar",
		label: "AR",
		native: "العربية"
	},
	{
		id: "ru",
		label: "RU",
		native: "Русский"
	},
	{
		id: "tr",
		label: "TR",
		native: "Türkçe"
	}
];
var LOCALE = {
	az: "az-AZ",
	ar: "ar",
	ru: "ru-RU",
	tr: "tr-TR"
};
var dict = {
	az: {
		brand: "Nibras QR",
		tagline: "QR-ni bir dəfə çap et. Linki istədiyin vaxt dəyiş.",
		nav: {
			create: "Yarat",
			scan: "Skaner",
			templates: "Şablonlar",
			dashboard: "QR-lərim",
			pricing: "Tariflər",
			signIn: "Daxil ol"
		},
		hero: {
			kicker: "QR Toolkit · Dynamic QR · Statistika",
			title: "Biznes üçün QR — çap et, sonra dəyiş.",
			body: "Restoran menyusu, Wi-Fi, WhatsApp və ödəniş. Eyni QR qalır, panelindən linki və dizaynı idarə edirsən. Skan sayı, ölkə və cihaz statistikası daxildir.",
			cta: "QR yarat",
			secondary: "Skaneri aç",
			point1: "11 növ QR",
			point2: "Dinamik link",
			point3: "Canlı statistika"
		},
		features: {
			title: "Sadə generator yox, biznes aləti",
			create: "Yarat",
			createBody: "URL, mətn, telefon, email, WhatsApp, Wi-Fi, vCard, məkan, SMS, tədbir və app linki.",
			dynamic: "Dinamik QR",
			dynamicBody: "QR eyni qalır. Menyunu, kampaniyanı və ya WhatsApp nömrəsini paneldən dəyişirsən.",
			design: "Dizayn",
			designBody: "Rəng, gradient, nöqtə forması, göz stili, loqo, çərçivə və şəffaf fon.",
			stats: "Statistika",
			statsBody: "Skan sayı, gün/ay qrafiki, cihaz və ölkə. Hansı QR işləyir, görünür.",
			scan: "Skaner",
			scanBody: "Kamera və ya qalereya. Nəticəni kopyala, linki aç, tarixçədə saxla.",
			export: "Export",
			exportBody: "PNG, JPG, SVG və PDF. Premium-da yüksək keyfiyyət, brendinqsiz."
		},
		types: {
			url: "URL",
			text: "Mətn",
			phone: "Telefon",
			email: "Email",
			whatsapp: "WhatsApp",
			wifi: "Wi-Fi",
			vcard: "Kontakt",
			location: "Məkan",
			sms: "SMS",
			event: "Tədbir",
			app: "App linki"
		},
		fields: {
			url: "Keçid",
			text: "Mətn",
			phone: "Telefon",
			email: "Email",
			subject: "Mövzu",
			body: "Məzmun",
			ssid: "Şəbəkə adı (SSID)",
			password: "Şifrə",
			encryption: "Şifrələmə",
			hidden: "Gizli şəbəkə",
			firstName: "Ad",
			lastName: "Soyad",
			org: "Şirkət",
			title: "Vəzifə",
			street: "Küçə",
			city: "Şəhər",
			country: "Ölkə",
			lat: "Enlik",
			lng: "Uzunluq",
			query: "Ünvan və ya yer",
			start: "Başlanğıc",
			end: "Bitmə",
			location: "Yer",
			description: "Təsvir",
			name: "QR adı"
		},
		create: {
			title: "QR yarat",
			static: "Statik",
			dynamic: "Dinamik",
			dynamicHint: "QR eyni qalır, link sonradan dəyişir. Premium tələb olunur.",
			save: "Yadda saxla",
			update: "Yenilə",
			saved: "Saxlanıldı",
			needAuth: "Dinamik QR üçün daxil ol",
			needPremium: "Dinamik QR Premium-dadır",
			empty: "Məzmunu doldur — QR canlı yenilənir"
		},
		design: {
			title: "Dizayn",
			colors: "Rənglər",
			foreground: "Ön plan",
			background: "Fon",
			transparent: "Şəffaf fon",
			gradient: "Gradient",
			dots: "Nöqtələr",
			eyes: "Gözlər",
			logo: "Loqo",
			frame: "Çərçivə",
			scanText: "Yazı",
			bgImage: "Fon şəkli",
			premium: "Premium",
			square: "Kvadrat",
			rounded: "Dairəvi",
			dotsStyle: "Nöqtə",
			classy: "Classy",
			extra: "Yumşaq",
			leaf: "Yarpaq",
			none: "Yoxdur",
			quiet: "Sakit",
			banner: "Banner",
			scanme: "Scan me",
			ticket: "Bilet"
		},
		export: {
			png: "PNG",
			jpg: "JPG",
			svg: "SVG",
			pdf: "PDF",
			copy: "Kopyala",
			copied: "Kopyalandı",
			share: "Paylaş"
		},
		scan: {
			title: "Skaner",
			camera: "Kamera",
			gallery: "Qalereya",
			start: "Kameranı aç",
			stop: "Dayandır",
			result: "Nəticə",
			open: "Aç",
			copy: "Kopyala",
			empty: "QR-ə tuşla və ya şəkil yüklə",
			history: "Tarixçə",
			clear: "Təmizlə",
			denied: "Kamera icazəsi verilmədi. Qalereyadan oxut."
		},
		dash: {
			title: "QR-lərim",
			empty: "Hələ QR yoxdur. Birini yarat, burada idarə et.",
			scans: "skan",
			active: "Aktiv",
			paused: "Deaktiv",
			edit: "Redaktə",
			download: "Yüklə",
			duplicate: "Dublikat",
			pause: "Dayandır",
			resume: "Aktiv et",
			delete: "Sil",
			folder: "Qovluq",
			all: "Hamısı",
			newFolder: "Yeni qovluq",
			stats: "Statistika",
			created: "Yaradılıb",
			type: "Növ",
			dynamic: "Dinamik",
			static: "Statik"
		},
		stats: {
			total: "Cəmi skan",
			week: "7 gün",
			month: "30 gün",
			devices: "Cihazlar",
			countries: "Ölkələr",
			series: "Günlük skan",
			empty: "Hələ skan yoxdur. QR-i çap et və izlə.",
			dest: "Cari keçid",
			saveDest: "Keçidi yenilə"
		},
		pricing: {
			title: "Sadə tarif. Pul qazandıran fərq dinamik QR-dir.",
			free: "Free",
			premium: "Premium",
			business: "Business",
			month: "/ ay",
			ctaFree: "Pulsuz başla",
			ctaPremium: "Premium-a keç",
			ctaBusiness: "Business-ə keç",
			current: "Cari plan",
			note: "Ödəniş inteqrasiyası növbəti mərhələdədir. İndi planı aktivləşdirib bütün alətləri sına.",
			f1: "Limitsiz statik QR",
			f2: "Skaner",
			f3: "PNG export",
			f4: "Əsas rənglər",
			p1: "Dinamik QR",
			p2: "Loqo və xüsusi dizayn",
			p3: "SVG / PDF / yüksək keyfiyyət",
			p4: "Statistika",
			p5: "Qovluqlar",
			p6: "Brendinqsiz export",
			p7: "Biznes şablonları",
			b1: "500 dinamik QR",
			b2: "API açarı",
			b3: "Komanda üçün hazır",
			b4: "Geniş statistika",
			b5: "White-label yol xəritəsi"
		},
		templates: {
			title: "Hazır şablonlar",
			body: "Sıfırdan dizayn etmə. Şablonu seç, məlumatı yaz, çap et.",
			use: "İstifadə et",
			wifi: "Wi-Fi",
			restaurant: "Restoran",
			business: "Biznes kartı",
			social: "Sosial media",
			contact: "Kontakt",
			event: "Tədbir",
			payment: "Ödəniş",
			whatsapp: "WhatsApp"
		},
		login: {
			title: "Nibras QR-ə daxil ol",
			body: "QR-lərini, dinamik linkləri və statistikanı bir paneldə saxla.",
			google: "Google ilə davam et",
			error: "Daxil olmaq alınmadı. Yenidən cəhd et."
		},
		public: {
			missing: "Bu QR tapılmadı",
			inactive: "Bu QR müvəqqəti dayandırılıb",
			open: "Keçidi aç",
			wifi: "Wi-Fi şəbəkəsi",
			connect: "Şifrəni kopyala",
			contact: "Kontaktı yüklə"
		},
		common: {
			loading: "Yüklənir",
			cancel: "Ləğv et",
			confirm: "Təsdiq et",
			search: "Axtar",
			upgrade: "Premium-a keç",
			locked: "Premium"
		},
		legal: {
			privacy: "Məxfilik siyasəti",
			version: "Versiya"
		}
	},
	ar: {
		brand: "Nibras QR",
		tagline: "اطبع رمز QR مرة واحدة. غيّر الرابط متى شئت.",
		nav: {
			create: "إنشاء",
			scan: "ماسح",
			templates: "قوالب",
			dashboard: "رموزي",
			pricing: "الباقات",
			signIn: "دخول"
		},
		hero: {
			kicker: "أدوات QR · رموز ديناميكية · إحصاءات",
			title: "QR للأعمال — اطبعه ثم غيّره.",
			body: "قائمة المطعم وواي فاي وواتساب والدفع. يبقى الرمز كما هو وتدير الرابط والتصميم من اللوحة. يشمل عدد المسح والدولة والجهاز.",
			cta: "أنشئ QR",
			secondary: "افتح الماسح",
			point1: "11 نوعاً",
			point2: "رابط ديناميكي",
			point3: "إحصاءات مباشرة"
		},
		features: {
			title: "ليس مولّداً بسيطاً — أداة أعمال",
			create: "إنشاء",
			createBody: "رابط، نص، هاتف، بريد، واتساب، واي فاي، بطاقة اتصال، موقع، رسالة، فعالية وروابط التطبيقات.",
			dynamic: "QR ديناميكي",
			dynamicBody: "الرمز ثابت. غيّر القائمة أو الحملة أو رقم واتساب من اللوحة.",
			design: "التصميم",
			designBody: "لون، تدرج، شكل النقاط، العيون، الشعار، الإطار والخلفية الشفافة.",
			stats: "الإحصاءات",
			statsBody: "عدد المسح، رسم يومي/شهري، الجهاز والدولة. اعرف أي رمز يعمل.",
			scan: "الماسح",
			scanBody: "كاميرا أو معرض. انسخ النتيجة، افتح الرابط، احفظ السجل.",
			export: "تصدير",
			exportBody: "PNG وJPG وSVG وPDF. في بريميوم جودة عالية بلا علامة تجارية."
		},
		types: {
			url: "رابط",
			text: "نص",
			phone: "هاتف",
			email: "بريد",
			whatsapp: "واتساب",
			wifi: "واي فاي",
			vcard: "جهة اتصال",
			location: "موقع",
			sms: "رسالة",
			event: "فعالية",
			app: "رابط تطبيق"
		},
		fields: {
			url: "الرابط",
			text: "النص",
			phone: "الهاتف",
			email: "البريد",
			subject: "الموضوع",
			body: "المحتوى",
			ssid: "اسم الشبكة (SSID)",
			password: "كلمة المرور",
			encryption: "التشفير",
			hidden: "شبكة مخفية",
			firstName: "الاسم",
			lastName: "اللقب",
			org: "الشركة",
			title: "المنصب",
			street: "الشارع",
			city: "المدينة",
			country: "الدولة",
			lat: "خط العرض",
			lng: "خط الطول",
			query: "العنوان أو المكان",
			start: "البداية",
			end: "النهاية",
			location: "المكان",
			description: "الوصف",
			name: "اسم الرمز"
		},
		create: {
			title: "إنشاء QR",
			static: "ثابت",
			dynamic: "ديناميكي",
			dynamicHint: "الرمز المطبوع لا يتغير، والرابط يمكن تبديله لاحقاً. يتطلب بريميوم.",
			save: "حفظ",
			update: "تحديث",
			saved: "تم الحفظ",
			needAuth: "سجّل الدخول للرموز الديناميكية",
			needPremium: "الرمز الديناميكي ضمن بريميوم",
			empty: "املأ المحتوى — يتحدّث الرمز فوراً"
		},
		design: {
			title: "التصميم",
			colors: "الألوان",
			foreground: "المقدمة",
			background: "الخلفية",
			transparent: "خلفية شفافة",
			gradient: "تدرج",
			dots: "النقاط",
			eyes: "العيون",
			logo: "الشعار",
			frame: "الإطار",
			scanText: "النص",
			bgImage: "صورة الخلفية",
			premium: "بريميوم",
			square: "مربع",
			rounded: "مدوّر",
			dotsStyle: "نقاط",
			classy: "أنيق",
			extra: "ناعم",
			leaf: "ورقة",
			none: "بدون",
			quiet: "هادئ",
			banner: "شريط",
			scanme: "امسحني",
			ticket: "تذكرة"
		},
		export: {
			png: "PNG",
			jpg: "JPG",
			svg: "SVG",
			pdf: "PDF",
			copy: "نسخ",
			copied: "تم النسخ",
			share: "مشاركة"
		},
		scan: {
			title: "الماسح",
			camera: "كاميرا",
			gallery: "معرض",
			start: "افتح الكاميرا",
			stop: "إيقاف",
			result: "النتيجة",
			open: "فتح",
			copy: "نسخ",
			empty: "وجّه نحو الرمز أو ارفع صورة",
			history: "السجل",
			clear: "مسح",
			denied: "رُفض إذن الكاميرا. استخدم صورة من المعرض."
		},
		dash: {
			title: "رموز QR",
			empty: "لا رموز بعد. أنشئ واحداً وأدره من هنا.",
			scans: "مسح",
			active: "نشط",
			paused: "متوقف",
			edit: "تعديل",
			download: "تنزيل",
			duplicate: "نسخ",
			pause: "إيقاف",
			resume: "تفعيل",
			delete: "حذف",
			folder: "مجلد",
			all: "الكل",
			newFolder: "مجلد جديد",
			stats: "إحصاءات",
			created: "أُنشئ",
			type: "النوع",
			dynamic: "ديناميكي",
			static: "ثابت"
		},
		stats: {
			total: "إجمالي المسح",
			week: "7 أيام",
			month: "30 يوماً",
			devices: "الأجهزة",
			countries: "الدول",
			series: "المسح اليومي",
			empty: "لا مسح بعد. اطبع الرمز وتابعه.",
			dest: "الوجهة الحالية",
			saveDest: "حدّث الوجهة"
		},
		pricing: {
			title: "باقات بسيطة. الفرق المدفوع هو الرمز الديناميكي.",
			free: "مجاني",
			premium: "بريميوم",
			business: "أعمال",
			month: "/ شهر",
			ctaFree: "ابدأ مجاناً",
			ctaPremium: "انتقل إلى بريميوم",
			ctaBusiness: "انتقل إلى أعمال",
			current: "الباقة الحالية",
			note: "الدفع في المرحلة التالية. فعّل باقة الآن لتجربة كل الأدوات.",
			f1: "رموز ثابتة بلا حد",
			f2: "الماسح",
			f3: "تصدير PNG",
			f4: "ألوان أساسية",
			p1: "QR ديناميكي",
			p2: "شعار وتصميم مخصص",
			p3: "SVG / PDF / دقة عالية",
			p4: "إحصاءات",
			p5: "مجلدات",
			p6: "تصدير بلا علامة",
			p7: "قوالب أعمال",
			b1: "500 رمزاً ديناميكياً",
			b2: "مفتاح API",
			b3: "جاهز للفريق",
			b4: "إحصاءات أوسع",
			b5: "وسم أبيض على الخارطة"
		},
		templates: {
			title: "قوالب جاهزة",
			body: "لا تبدأ من الصفر. اختر قالباً، املأه، اطبعه.",
			use: "استخدم",
			wifi: "واي فاي",
			restaurant: "مطعم",
			business: "بطاقة عمل",
			social: "تواصل اجتماعي",
			contact: "جهة اتصال",
			event: "فعالية",
			payment: "دفع",
			whatsapp: "واتساب"
		},
		login: {
			title: "دخول إلى Nibras QR",
			body: "احفظ الرموز والروابط الديناميكية والإحصاءات في لوحة واحدة.",
			google: "المتابعة عبر Google",
			error: "تعذّر تسجيل الدخول. حاول مرة أخرى."
		},
		public: {
			missing: "هذا الرمز غير موجود",
			inactive: "هذا الرمز متوقف مؤقتاً",
			open: "افتح الرابط",
			wifi: "شبكة واي فاي",
			connect: "انسخ كلمة المرور",
			contact: "نزّل جهة الاتصال"
		},
		common: {
			loading: "جارٍ التحميل",
			cancel: "إلغاء",
			confirm: "تأكيد",
			search: "بحث",
			upgrade: "انتقل إلى بريميوم",
			locked: "بريميوم"
		},
		legal: {
			privacy: "سياسة الخصوصية",
			version: "الإصدار"
		}
	},
	ru: {
		brand: "Nibras QR",
		tagline: "Напечатайте QR один раз. Меняйте ссылку когда угодно.",
		nav: {
			create: "Создать",
			scan: "Сканер",
			templates: "Шаблоны",
			dashboard: "Мои QR",
			pricing: "Тарифы",
			signIn: "Войти"
		},
		hero: {
			kicker: "QR Toolkit · Динамический QR · Статистика",
			title: "QR для бизнеса — напечатали, потом меняете.",
			body: "Меню ресторана, Wi-Fi, WhatsApp и оплата. Код остаётся тем же, ссылку и дизайн вы ведёте из панели. Есть сканы, страна и устройство.",
			cta: "Создать QR",
			secondary: "Открыть сканер",
			point1: "11 типов QR",
			point2: "Динамическая ссылка",
			point3: "Живая статистика"
		},
		features: {
			title: "Не игрушечный генератор, а рабочий инструмент",
			create: "Создать",
			createBody: "URL, текст, телефон, email, WhatsApp, Wi-Fi, визитка, место, SMS, событие и ссылка на приложение.",
			dynamic: "Динамический QR",
			dynamicBody: "Код не меняется. Меню, кампанию или номер WhatsApp меняете в панели.",
			design: "Дизайн",
			designBody: "Цвет, градиент, форма точек, глаза, логотип, рамка и прозрачный фон.",
			stats: "Статистика",
			statsBody: "Число сканов, график по дням, устройство и страна. Видно, какой QR работает.",
			scan: "Сканер",
			scanBody: "Камера или галерея. Скопировать, открыть ссылку, сохранить историю.",
			export: "Экспорт",
			exportBody: "PNG, JPG, SVG и PDF. В Premium — высокое качество без бренда."
		},
		types: {
			url: "URL",
			text: "Текст",
			phone: "Телефон",
			email: "Email",
			whatsapp: "WhatsApp",
			wifi: "Wi-Fi",
			vcard: "Контакт",
			location: "Место",
			sms: "SMS",
			event: "Событие",
			app: "Ссылка на приложение"
		},
		fields: {
			url: "Ссылка",
			text: "Текст",
			phone: "Телефон",
			email: "Email",
			subject: "Тема",
			body: "Текст",
			ssid: "Имя сети (SSID)",
			password: "Пароль",
			encryption: "Шифрование",
			hidden: "Скрытая сеть",
			firstName: "Имя",
			lastName: "Фамилия",
			org: "Компания",
			title: "Должность",
			street: "Улица",
			city: "Город",
			country: "Страна",
			lat: "Широта",
			lng: "Долгота",
			query: "Адрес или место",
			start: "Начало",
			end: "Конец",
			location: "Место",
			description: "Описание",
			name: "Имя QR"
		},
		create: {
			title: "Создать QR",
			static: "Статический",
			dynamic: "Динамический",
			dynamicHint: "Печатный код тот же, ссылку можно сменить позже. Нужен Premium.",
			save: "Сохранить",
			update: "Обновить",
			saved: "Сохранено",
			needAuth: "Войдите для динамического QR",
			needPremium: "Динамический QR — в Premium",
			empty: "Заполните содержимое — QR обновляется сразу"
		},
		design: {
			title: "Дизайн",
			colors: "Цвета",
			foreground: "Передний план",
			background: "Фон",
			transparent: "Прозрачный фон",
			gradient: "Градиент",
			dots: "Точки",
			eyes: "Глаза",
			logo: "Логотип",
			frame: "Рамка",
			scanText: "Подпись",
			bgImage: "Фоновое изображение",
			premium: "Premium",
			square: "Квадрат",
			rounded: "Скругление",
			dotsStyle: "Точки",
			classy: "Классика",
			extra: "Мягкий",
			leaf: "Лист",
			none: "Нет",
			quiet: "Тихий",
			banner: "Баннер",
			scanme: "Scan me",
			ticket: "Билет"
		},
		export: {
			png: "PNG",
			jpg: "JPG",
			svg: "SVG",
			pdf: "PDF",
			copy: "Копировать",
			copied: "Скопировано",
			share: "Поделиться"
		},
		scan: {
			title: "Сканер",
			camera: "Камера",
			gallery: "Галерея",
			start: "Открыть камеру",
			stop: "Стоп",
			result: "Результат",
			open: "Открыть",
			copy: "Копировать",
			empty: "Наведите на QR или загрузите фото",
			history: "История",
			clear: "Очистить",
			denied: "Нет доступа к камере. Используйте фото из галереи."
		},
		dash: {
			title: "Мои QR",
			empty: "Пока нет кодов. Создайте один и управляйте здесь.",
			scans: "сканов",
			active: "Активен",
			paused: "Пауза",
			edit: "Изменить",
			download: "Скачать",
			duplicate: "Дублировать",
			pause: "Пауза",
			resume: "Включить",
			delete: "Удалить",
			folder: "Папка",
			all: "Все",
			newFolder: "Новая папка",
			stats: "Статистика",
			created: "Создан",
			type: "Тип",
			dynamic: "Динамический",
			static: "Статический"
		},
		stats: {
			total: "Всего сканов",
			week: "7 дней",
			month: "30 дней",
			devices: "Устройства",
			countries: "Страны",
			series: "Сканы по дням",
			empty: "Сканов ещё нет. Напечатайте код и следите.",
			dest: "Текущая ссылка",
			saveDest: "Обновить ссылку"
		},
		pricing: {
			title: "Простые тарифы. Платное отличие — динамический QR.",
			free: "Free",
			premium: "Premium",
			business: "Business",
			month: "/ мес",
			ctaFree: "Начать бесплатно",
			ctaPremium: "Перейти на Premium",
			ctaBusiness: "Перейти на Business",
			current: "Текущий план",
			note: "Оплата — на следующем этапе. Активируйте план сейчас и проверьте весь набор.",
			f1: "Безлимитные статические QR",
			f2: "Сканер",
			f3: "Экспорт PNG",
			f4: "Базовые цвета",
			p1: "Динамический QR",
			p2: "Логотип и свой дизайн",
			p3: "SVG / PDF / высокое качество",
			p4: "Статистика",
			p5: "Папки",
			p6: "Экспорт без бренда",
			p7: "Бизнес-шаблоны",
			b1: "500 динамических QR",
			b2: "API-ключ",
			b3: "Готово для команды",
			b4: "Расширенная статистика",
			b5: "White-label в планах"
		},
		templates: {
			title: "Готовые шаблоны",
			body: "Не с нуля. Выберите шаблон, заполните, печатайте.",
			use: "Использовать",
			wifi: "Wi-Fi",
			restaurant: "Ресторан",
			business: "Визитка",
			social: "Соцсети",
			contact: "Контакт",
			event: "Событие",
			payment: "Оплата",
			whatsapp: "WhatsApp"
		},
		login: {
			title: "Вход в Nibras QR",
			body: "Коды, динамические ссылки и статистика — в одной панели.",
			google: "Продолжить с Google",
			error: "Не удалось войти. Попробуйте ещё раз."
		},
		public: {
			missing: "Этот QR не найден",
			inactive: "Этот QR временно отключён",
			open: "Открыть ссылку",
			wifi: "Сеть Wi-Fi",
			connect: "Скопировать пароль",
			contact: "Скачать контакт"
		},
		common: {
			loading: "Загрузка",
			cancel: "Отмена",
			confirm: "Подтвердить",
			search: "Поиск",
			upgrade: "Перейти на Premium",
			locked: "Premium"
		},
		legal: {
			privacy: "Политика конфиденциальности",
			version: "Версия"
		}
	},
	tr: {
		brand: "Nibras QR",
		tagline: "QR'ı bir kez yazdır. Bağlantıyı istediğin zaman değiştir.",
		nav: {
			create: "Oluştur",
			scan: "Tarayıcı",
			templates: "Şablonlar",
			dashboard: "QR'larım",
			pricing: "Planlar",
			signIn: "Giriş"
		},
		hero: {
			kicker: "QR Toolkit · Dinamik QR · İstatistik",
			title: "İş için QR — yazdır, sonra değiştir.",
			body: "Restoran menüsü, Wi-Fi, WhatsApp ve ödeme. Aynı QR kalır; bağlantıyı ve tasarımı panelden yönetirsin. Tarama sayısı, ülke ve cihaz dahildir.",
			cta: "QR oluştur",
			secondary: "Tarayıcıyı aç",
			point1: "11 QR türü",
			point2: "Dinamik bağlantı",
			point3: "Canlı istatistik"
		},
		features: {
			title: "Basit bir üreteç değil, iş aracı",
			create: "Oluştur",
			createBody: "URL, metin, telefon, e-posta, WhatsApp, Wi-Fi, kartvizit, konum, SMS, etkinlik ve uygulama bağlantısı.",
			dynamic: "Dinamik QR",
			dynamicBody: "Kod aynı kalır. Menüyü, kampanyayı veya WhatsApp numarasını panelden değiştirirsin.",
			design: "Tasarım",
			designBody: "Renk, gradyan, nokta şekli, göz stili, logo, çerçeve ve şeffaf arka plan.",
			stats: "İstatistik",
			statsBody: "Tarama sayısı, gün/ay grafiği, cihaz ve ülke. Hangi QR çalışıyor, görünür.",
			scan: "Tarayıcı",
			scanBody: "Kamera veya galeri. Sonucu kopyala, bağlantıyı aç, geçmişi tut.",
			export: "Dışa aktar",
			exportBody: "PNG, JPG, SVG ve PDF. Premium'da yüksek kalite, markasız."
		},
		types: {
			url: "URL",
			text: "Metin",
			phone: "Telefon",
			email: "E-posta",
			whatsapp: "WhatsApp",
			wifi: "Wi-Fi",
			vcard: "Kişi",
			location: "Konum",
			sms: "SMS",
			event: "Etkinlik",
			app: "Uygulama bağlantısı"
		},
		fields: {
			url: "Bağlantı",
			text: "Metin",
			phone: "Telefon",
			email: "E-posta",
			subject: "Konu",
			body: "İçerik",
			ssid: "Ağ adı (SSID)",
			password: "Şifre",
			encryption: "Şifreleme",
			hidden: "Gizli ağ",
			firstName: "Ad",
			lastName: "Soyad",
			org: "Şirket",
			title: "Unvan",
			street: "Sokak",
			city: "Şehir",
			country: "Ülke",
			lat: "Enlem",
			lng: "Boylam",
			query: "Adres veya yer",
			start: "Başlangıç",
			end: "Bitiş",
			location: "Yer",
			description: "Açıklama",
			name: "QR adı"
		},
		create: {
			title: "QR oluştur",
			static: "Statik",
			dynamic: "Dinamik",
			dynamicHint: "Yazdırılan QR aynı kalır, bağlantı sonra değişir. Premium gerekir.",
			save: "Kaydet",
			update: "Güncelle",
			saved: "Kaydedildi",
			needAuth: "Dinamik QR için giriş yap",
			needPremium: "Dinamik QR Premium'dadır",
			empty: "İçeriği doldur — QR anında güncellenir"
		},
		design: {
			title: "Tasarım",
			colors: "Renkler",
			foreground: "Ön plan",
			background: "Arka plan",
			transparent: "Şeffaf arka plan",
			gradient: "Gradyan",
			dots: "Noktalar",
			eyes: "Gözler",
			logo: "Logo",
			frame: "Çerçeve",
			scanText: "Yazı",
			bgImage: "Arka plan görseli",
			premium: "Premium",
			square: "Kare",
			rounded: "Yuvarlak",
			dotsStyle: "Nokta",
			classy: "Klasik",
			extra: "Yumuşak",
			leaf: "Yaprak",
			none: "Yok",
			quiet: "Sakin",
			banner: "Banner",
			scanme: "Scan me",
			ticket: "Bilet"
		},
		export: {
			png: "PNG",
			jpg: "JPG",
			svg: "SVG",
			pdf: "PDF",
			copy: "Kopyala",
			copied: "Kopyalandı",
			share: "Paylaş"
		},
		scan: {
			title: "Tarayıcı",
			camera: "Kamera",
			gallery: "Galeri",
			start: "Kamerayı aç",
			stop: "Durdur",
			result: "Sonuç",
			open: "Aç",
			copy: "Kopyala",
			empty: "QR'a tut veya görsel yükle",
			history: "Geçmiş",
			clear: "Temizle",
			denied: "Kamera izni verilmedi. Galeriden oku."
		},
		dash: {
			title: "QR'larım",
			empty: "Henüz QR yok. Bir tane oluştur, buradan yönet.",
			scans: "tarama",
			active: "Aktif",
			paused: "Duraklatıldı",
			edit: "Düzenle",
			download: "İndir",
			duplicate: "Çoğalt",
			pause: "Duraklat",
			resume: "Aktif et",
			delete: "Sil",
			folder: "Klasör",
			all: "Tümü",
			newFolder: "Yeni klasör",
			stats: "İstatistik",
			created: "Oluşturuldu",
			type: "Tür",
			dynamic: "Dinamik",
			static: "Statik"
		},
		stats: {
			total: "Toplam tarama",
			week: "7 gün",
			month: "30 gün",
			devices: "Cihazlar",
			countries: "Ülkeler",
			series: "Günlük tarama",
			empty: "Henüz tarama yok. QR'ı yazdır ve izle.",
			dest: "Güncel bağlantı",
			saveDest: "Bağlantıyı güncelle"
		},
		pricing: {
			title: "Basit plan. Asıl fark dinamik QR.",
			free: "Free",
			premium: "Premium",
			business: "Business",
			month: "/ ay",
			ctaFree: "Ücretsiz başla",
			ctaPremium: "Premium'a geç",
			ctaBusiness: "Business'a geç",
			current: "Mevcut plan",
			note: "Ödeme sonraki aşamada. Şimdi planı açıp tüm araçları dene.",
			f1: "Sınırsız statik QR",
			f2: "Tarayıcı",
			f3: "PNG dışa aktarma",
			f4: "Temel renkler",
			p1: "Dinamik QR",
			p2: "Logo ve özel tasarım",
			p3: "SVG / PDF / yüksek kalite",
			p4: "İstatistik",
			p5: "Klasörler",
			p6: "Markasız dışa aktarma",
			p7: "İş şablonları",
			b1: "500 dinamik QR",
			b2: "API anahtarı",
			b3: "Ekip için hazır",
			b4: "Geniş istatistik",
			b5: "White-label yol haritasında"
		},
		templates: {
			title: "Hazır şablonlar",
			body: "Sıfırdan tasarlama. Şablon seç, doldur, yazdır.",
			use: "Kullan",
			wifi: "Wi-Fi",
			restaurant: "Restoran",
			business: "Kartvizit",
			social: "Sosyal medya",
			contact: "Kişi",
			event: "Etkinlik",
			payment: "Ödeme",
			whatsapp: "WhatsApp"
		},
		login: {
			title: "Nibras QR'a giriş",
			body: "QR'larını, dinamik bağlantıları ve istatistiği tek panelde tut.",
			google: "Google ile devam et",
			error: "Giriş yapılamadı. Tekrar dene."
		},
		public: {
			missing: "Bu QR bulunamadı",
			inactive: "Bu QR geçici olarak durduruldu",
			open: "Bağlantıyı aç",
			wifi: "Wi-Fi ağı",
			connect: "Şifreyi kopyala",
			contact: "Kişiyi indir"
		},
		common: {
			loading: "Yükleniyor",
			cancel: "İptal",
			confirm: "Onayla",
			search: "Ara",
			upgrade: "Premium'a geç",
			locked: "Premium"
		},
		legal: {
			privacy: "Gizlilik politikası",
			version: "Sürüm"
		}
	}
};
function isLang(v) {
	return v === "az" || v === "ar" || v === "ru" || v === "tr";
}
var I18nContext = (0, import_react.createContext)(null);
function I18nProvider({ children }) {
	const [lang, setLangState] = (0, import_react.useState)("az");
	(0, import_react.useEffect)(() => {
		try {
			const saved = window.localStorage.getItem("nibras-lang");
			if (isLang(saved)) setLangState(saved);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		document.documentElement.lang = lang;
		document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
	}, [lang]);
	const setLang = (0, import_react.useCallback)((l) => {
		setLangState(l);
		try {
			window.localStorage.setItem("nibras-lang", l);
		} catch {}
	}, []);
	const value = (0, import_react.useMemo)(() => ({
		lang,
		setLang,
		t: dict[lang]
	}), [lang, setLang]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(I18nContext.Provider, {
		value,
		children
	});
}
function useI18n() {
	const ctx = (0, import_react.useContext)(I18nContext);
	if (!ctx) throw new Error("useI18n");
	return ctx;
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var APP_VERSION = "1.0.0";
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
function DropdownMenuContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		sideOffset: 6,
		className: cn("z-50 min-w-44 rounded-xl bg-bg-elevated p-1 shadow-[var(--shadow-border)]", className),
		...props
	}) });
}
function DropdownMenuItem({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
		className: cn("flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-bg-subtle", className),
		...props
	});
}
function Skeleton({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("animate-pulse rounded-lg bg-bg-subtle", className) });
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[opacity,transform,background-color,color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-fg hover:opacity-90",
			secondary: "bg-bg-subtle text-fg hover:bg-bg-elevated",
			outline: "border border-border bg-transparent text-fg hover:bg-bg-subtle",
			ghost: "text-fg hover:bg-bg-subtle",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function AuthSlot() {
	const { t } = useI18n();
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-24 rounded-full" });
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		size: "sm",
		variant: "outline",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			children: t.nav.signIn
		})
	});
}
function LangToggle() {
	const { lang, setLang } = useI18n();
	const current = LANGS.find((l) => l.id === lang) ?? LANGS[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		className: "h-9 rounded-lg px-2.5 text-xs font-medium text-muted hover:bg-bg-subtle hover:text-fg",
		"aria-label": current.native,
		children: current.label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent, {
		align: "end",
		children: LANGS.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
			onSelect: () => setLang(l.id),
			className: lang === l.id ? "text-primary" : void 0,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-7 text-xs text-subtle",
				children: l.label
			}), l.native]
		}, l.id))
	})] });
}
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: "flex items-center gap-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-8 place-items-center rounded-lg bg-primary text-primary-fg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-4" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-sm font-semibold tracking-tight",
			children: "Nibras QR"
		})]
	});
}
function AppShell({ children }) {
	const { t } = useI18n();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	if (pathname.startsWith("/r/")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children
	});
	const links = [
		{
			to: "/create",
			label: t.nav.create,
			icon: QrCode
		},
		{
			to: "/scan",
			label: t.nav.scan,
			icon: ScanLine
		},
		{
			to: "/templates",
			label: t.nav.templates,
			icon: Shapes
		},
		{
			to: "/dashboard",
			label: t.nav.dashboard,
			icon: LayoutGrid
		},
		{
			to: "/pricing",
			label: t.nav.pricing,
			icon: Sparkles
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "hidden items-center gap-1 md:flex",
							children: links.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: l.to,
								className: cn("rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-fg", pathname === l.to && "bg-bg-subtle text-fg"),
								children: l.label
							}, l.to))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LangToggle, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthSlot, {})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 pb-6",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-border/80 px-4 py-4 pb-20 md:pb-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Nibras QR · ",
						t.legal.version,
						" ",
						APP_VERSION
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/privacy",
						className: "hover:text-fg",
						children: t.legal.privacy
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-md md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-5",
					children: links.map((l) => {
						const Icon = l.icon;
						const active = pathname === l.to || pathname.startsWith(l.to + "/");
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: l.to,
							className: cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-muted", active && "text-primary"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), l.label]
						}, l.to);
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "guest"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "member"
			}) })
		]
	});
}
var styles_default = "/assets/styles-C9rZ_Qof.css";
var APP_NAME = "Nibras QR";
function makeQueryClient() {
	return new QueryClient({ defaultOptions: { queries: {
		staleTime: 15e3,
		retry: 1
	} } });
}
var Route$11 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Nibras QR — dinamik QR, dizayn, skaner və statistika. QR-ni bir dəfə çap et, linki istədiyin vaxt dəyiş."
			},
			{
				name: "theme-color",
				content: "#090a0c"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: Root
});
function Root() {
	const [queryClient] = (0, import_react.useState)(makeQueryClient);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "az",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "antialiased",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
					client: queryClient,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(I18nProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
						theme: "dark",
						position: "top-center",
						richColors: false
					})] })
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$9 = () => import("./routes-GsNeWS0s.mjs");
var Route$10 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./create-DDoBwd4B.mjs");
var Route$9 = createFileRoute("/create")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./dashboard-CKu_kpm-.mjs");
var Route$8 = createFileRoute("/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./login-BzWkzAMu.mjs");
var Route$7 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./pricing-Dk5aJOv3.mjs");
var Route$6 = createFileRoute("/pricing")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./privacy-DJcq77uq.mjs");
var Route$5 = createFileRoute("/privacy")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./scan-8vUDdrTg.mjs");
var Route$4 = createFileRoute("/scan")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./templates-Ca4Vxk6R.mjs");
var Route$3 = createFileRoute("/templates")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./dashboard._id-D9gBigMK.mjs");
var Route$2 = createFileRoute("/dashboard/$id")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./r._code-pGkDwCFw.mjs");
var loadPublic = createServerFn({ method: "GET" }).validator((code) => code).handler(createSsrRpc("306d339050da9778edf776cad717a7dd9d756f234c8f7ce96ff5c78fdef3af5a"));
var Route$1 = createFileRoute("/r/$code")({
	server: { handlers: { GET: async ({ params, request, next }) => {
		const result = await resolveScan(params.code, request);
		if (result.kind === "redirect") return Response.redirect(result.url, 302);
		return next();
	} } },
	loader: ({ params }) => loadPublic({ data: params.code }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var Route = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var IndexRoute = Route$10.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$11
});
var CreateRoute = Route$9.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => Route$11
});
var DashboardRoute = Route$8.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$11
});
var LoginRoute = Route$7.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$11
});
var PricingRoute = Route$6.update({
	id: "/pricing",
	path: "/pricing",
	getParentRoute: () => Route$11
});
var PrivacyRoute = Route$5.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$11
});
var ScanRoute = Route$4.update({
	id: "/scan",
	path: "/scan",
	getParentRoute: () => Route$11
});
var TemplatesRoute = Route$3.update({
	id: "/templates",
	path: "/templates",
	getParentRoute: () => Route$11
});
var DashboardIdRoute = Route$2.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => DashboardRoute
});
var RCodeRoute = Route$1.update({
	id: "/r/$code",
	path: "/r/$code",
	getParentRoute: () => Route$11
});
var ApiAuthSplatRoute = Route.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$11
});
var DashboardRouteChildren = { DashboardIdRoute };
var rootRouteChildren = {
	IndexRoute,
	CreateRoute,
	DashboardRoute: DashboardRoute._addFileChildren(DashboardRouteChildren),
	LoginRoute,
	PricingRoute,
	PrivacyRoute,
	ScanRoute,
	TemplatesRoute,
	RCodeRoute,
	ApiAuthSplatRoute
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Skeleton as a, DropdownMenuItem as c, RedirectToSignIn as d, LOCALE as f, useCurrentUserState as h, Button as i, DropdownMenuTrigger as l, createSsrRpc as m, Route$1 as n, DropdownMenu as o, useI18n as p, Route$2 as r, DropdownMenuContent as s, router_exports as t, APP_VERSION as u };
