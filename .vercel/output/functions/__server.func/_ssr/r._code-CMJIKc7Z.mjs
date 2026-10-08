import { r as createServerFn } from "./ssr.mjs";
import { a as lookupPublicQr } from "./scan-B50Qo_0M.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/r._code-CMJIKc7Z.js
var loadPublic_createServerFn_handler = createServerRpc({
	id: "306d339050da9778edf776cad717a7dd9d756f234c8f7ce96ff5c78fdef3af5a",
	name: "loadPublic",
	filename: "src/routes/r.$code.tsx"
}, (opts) => loadPublic.__executeServer(opts));
var loadPublic = createServerFn({ method: "GET" }).validator((code) => code).handler(loadPublic_createServerFn_handler, async ({ data: code }) => {
	const qr = await lookupPublicQr(code);
	if (!qr) return { kind: "missing" };
	if (!qr.isActive) return {
		kind: "inactive",
		name: qr.name,
		qr
	};
	return {
		kind: "page",
		qr
	};
});
//#endregion
export { loadPublic_createServerFn_handler };
