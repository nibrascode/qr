import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { s as cn } from "./types-BGbzMcaj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-CtmSQOfN.js
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "muted", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide", tone === "muted" && "bg-bg-subtle text-muted", tone === "primary" && "bg-primary/15 text-primary", tone === "danger" && "bg-danger/15 text-danger", className),
		...props
	});
}
//#endregion
export { Badge as t };
