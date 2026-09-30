import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { V as require_react, _ as createFileRoute, b as useRouter, d as HeadContent, f as useRouterState, g as lazyRouteComponent, h as Outlet, l as require_react_dom, m as createRouter, u as Scripts, v as createRootRoute, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as isSignedOutOnPurpose, i as getBearerToken, n as clearSignedOut, o as signOut, t as authClient } from "./client-Bt_hiyG3.mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as authMiddleware, r as agencyName } from "./labels-DDHELNR_.mjs";
import { t as auth } from "./server-z1dq9cpj.mjs";
import { a as Menu, d as Building2, f as Bell, i as Settings, l as ChartColumn, n as Users, o as LayoutDashboard, r as TriangleAlert, t as X, u as CalendarDays } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BjwAJETe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = require_react_dom();
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
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
var prepareSignIn = createServerFn({ method: "GET" }).handler(createSsrRpc("8d29326e646abc4ff1ea14a838f3778f7e7e92c64e9c374214a4862056066a09"));
/** Map whatever was typed (username or email) to the login email Better Auth stores. */
var resolveLogin = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("fa5ca405739130f44b40fdeb653c103b9aef6c989f3b64221e54ca601100ff6e"));
var getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7671403ad0962b351a811b94149f985bc9d3180d1c0aa93e9a10c498cfc2b793"));
var getBoard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data ?? {}).handler(createSsrRpc("bd168c26832bb285b623842f4f8eb4ef0fc87c53e5567f4f960511cbfb14f10b"));
var listProperties = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("ba122b7adc434d32af21ab8d4a33dfbfe85ab454e4d68b0851e625c2c2211b29"));
var getProperty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("b3abc658381b8a2655c7e0ad71692bcda5a05daaf22e079e70f30dafbf36c7b8"));
var saveProperty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("2add3df0539fd084f6dd9c35c2990cd6c35fcf70da9613f18304b49188cb7358"));
var saveLandlord = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("5872cee24fcd4b69bb477c8ee4e6b58c4a0c3746f71057fc781c1768c411747e"));
var setLetAgreed = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("4033e886d774c190c8a1760c2898f14b3ba152f1e46d3e18cc45a380208d9cb7"));
var archiveProperty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("2726da936f8f59c1e2adb3ae81c891c219ad3c3f801b8bcf7458fc3fd0cb571e"));
var addViewing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("a86a5a17c8bd870616fa40726c11dbc5a5eca4fbe365530d15cea9d15319e2f9"));
var saveFeedback = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("7720e7ee327b5c863988df24004991dae4a1a790ef09d9157bbfbbc542bcf58e"));
var markContacted = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("526df20b630dfe9a7bbb2d4bfa5669773e426c7c2ed9c8165337b4dcbbf3c036"));
var markApplication = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("6a39be271979d8787b7ec2547bca79649b0682ba37992a2bd32503ee4c02958a"));
var listViewings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data ?? {}).handler(createSsrRpc("a4708e3a4bfb043d512297d219c798e960771a6b211be4b58e30c8eebb485022"));
var importDiary = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("25c670279bfdf0bf41335e970b5735d316c6beeef020d9e886d4e5a125190055"));
var deleteViewing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("94706ad269d302c23548779aee6baf83c2bfa11c70d58ab01e654cd7b23b839b"));
var listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1d185155ad87b876d3c2ef155c2f6363fb3984dc9a1e4bfd5d922e3cdddfcead"));
var saveStaff = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("64bbcf04a40bb8b0a6aa31e4d779127f3f3fe9161289f26b826e55a035e86f13"));
var changeOwnPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("6214ef86f9d5c180c2f4f0632a91966775984a07d405b7a2d23253d26b2edd18"));
var resetStaffPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("d9680284442d861927abb7259d24b004767dc82e9be8a057c06048ef5a0de34e"));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e35f4ebbd7a9ac007a3b1c8381138b3eadf6518f0d0cd684ccefa080ad8874c4"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("09dc536fba612986bcee0c6f23e26b4c6cee038a2bf69f9893989a02e9c51c5b"));
var saveGmailTrial = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("ab5c0a91dd902a7f35fffd853d02be49a888dfd7ab666ad3854404d3cf5a552b"));
var sendGmailTest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("dc24496dd2b9bd42833d2d8de5fe25504afea90c4c5d27ce77e00ca7cb554659"));
var saveBranchGmail = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("131720d6a909f57c2ca1d51ae58ffeaea1a9296a69dbf7c2f3c33345dd7f93cb"));
var sendBranchGmailTest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("48866bd60eca7445f1d1d37cf24cb091d9b955a1dd3cfea6077b0b7f4b056dbb"));
var sendFeedback = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("a2ec0219b673bd37537f43717656ad3a35d5b0dd398c44a3127a75ce0af17122"));
var getReports = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data ?? {}).handler(createSsrRpc("ac435b4244718d231225394a834ee098c99be1868b50aca6acd84a429af66387"));
function londonGreeting(now = /* @__PURE__ */ new Date()) {
	return Number(new Intl.DateTimeFormat("en-GB", {
		hour: "numeric",
		hourCycle: "h23",
		timeZone: "Europe/London"
	}).format(now)) < 12 ? "Good morning" : "Good afternoon";
}
function officePhone(agency) {
	return agency === "gr" ? "01823 325 250" : "01278 418 001";
}
function emailDraft(input) {
	const close = `Please do not reply to this email, as this inbox is not monitored. If you have any further questions, please call our office on ${officePhone(input.agency)}.

Kind regards,
${input.negotiator}
${agencyName(input.agency)}`;
	const where = `Following the viewing at ${input.address}${input.when ? ` on ${input.when}` : ""}`;
	const comments = viewerComments(input.feedback);
	const given = comments ? `\n\nFeedback given:\n${comments}` : "";
	const outcome = input.noFeedback || input.interest === "no_feedback" ? "no_feedback" : input.interest === "not_interested" ? "not_interested" : "interested";
	if (outcome === "no_feedback") return `${londonGreeting()},

${where}, feedback was not given at the viewing. We will continue to chase this and be in touch.${given}

${close}`;
	if (outcome === "not_interested") return `${londonGreeting()},

${where}, unfortunately the applicant is not interested in the property. We will continue booking further viewings.${given}

${close}`;
	return `${londonGreeting()},

${where}, the applicant is interested in the property and has been sent an application form to fill out. Once we have received it, we will send it over to you for review.${given}

${close}`;
}
var CANNED_FEEDBACK = /* @__PURE__ */ new Set([
	"The applicant is interested in the property and has been sent an application form to fill out. We will send this over once it is received.",
	"Unfortunately the applicant is not interested in the property. We will continue booking further viewings.",
	"Feedback was not given at the viewing. We will continue to chase this and be in touch.",
	"The applicant did not want to give feedback on the viewing. We will re-chase this and try to get the feedback."
]);
function viewerComments(feedback) {
	const text = feedback.trim();
	if (!text || CANNED_FEEDBACK.has(text)) return "";
	return text;
}
function LoginPanel({ onSignedIn }) {
	const [username, setUsername] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		prepareSignIn().catch(() => void 0);
	}, []);
	async function submit(event) {
		event.preventDefault();
		setPending(true);
		setError("");
		try {
			const { email } = await resolveLogin({ data: { username } });
			const result = await authClient.signIn.email({
				email,
				password,
				callbackURL: "/"
			});
			if (result.error) {
				const message = result.error.message ?? "";
				setError(/invalid email or password/i.test(message) ? "That username or password is not right." : message || "That username or password is not right.");
				return;
			}
			clearSignedOut();
			if (!(await authClient.getSession()).data?.user) {
				setError("That username or password is not right.");
				return;
			}
			onSignedIn?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-paper px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/feedy-logo.png?v=2",
					alt: "Feedy",
					className: "h-40 w-auto"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Sign in with your username and password. Email addresses work too."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					className: "mt-6 grid gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "h-11 rounded-xl border border-line px-3",
							placeholder: "Username",
							value: username,
							onChange: (event) => setUsername(event.target.value),
							autoComplete: "username",
							required: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "h-11 rounded-xl border border-line px-3",
							type: "password",
							placeholder: "Password",
							value: password,
							onChange: (event) => setPassword(event.target.value),
							autoComplete: "current-password",
							required: true
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-bad",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: pending,
							className: "h-11 rounded-xl bg-pine text-pine-ink",
							children: pending ? "Please wait…" : "Sign in"
						})
					]
				})
			]
		})
	});
}
var OfficeContext = (0, import_react.createContext)({
	me: null,
	agency: "all",
	setAgency: () => void 0,
	refreshMe: () => void 0
});
function useOffice() {
	return (0, import_react.useContext)(OfficeContext);
}
var NAV = [
	{
		to: "/",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/properties",
		label: "Properties",
		icon: Building2
	},
	{
		to: "/viewings",
		label: "Viewings",
		icon: CalendarDays
	},
	{
		to: "/outstanding",
		label: "Outstanding",
		icon: Bell
	},
	{
		to: "/reports",
		label: "Reports",
		icon: ChartColumn
	},
	{
		to: "/staff",
		label: "Staff",
		icon: Users
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Settings
	}
];
function Shell({ children }) {
	const { user, isPending } = useCurrentUserState();
	const [me, setMe] = (0, import_react.useState)(null);
	const [agency, setAgencyState] = (0, import_react.useState)("all");
	const [passwordTick, setPasswordTick] = (0, import_react.useState)(0);
	const [open, setOpen] = (0, import_react.useState)(false);
	const signedOut = isSignedOutOnPurpose() && !getBearerToken();
	const path = useRouterState({ select: (state) => state.location.pathname });
	(0, import_react.useEffect)(() => {
		const stored = localStorage.getItem("viewingdesk-agency");
		if (stored) setAgencyState(stored);
	}, []);
	function setAgency(next) {
		setAgencyState(next);
		localStorage.setItem("viewingdesk-agency", next);
	}
	function refreshMe() {
		if (!user) return;
		getMe().then(setMe).catch(() => setMe(null));
	}
	(0, import_react.useEffect)(() => {
		if (!user) return;
		refreshMe();
	}, [user?.id]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-paper text-muted",
		children: "Opening the office book…"
	});
	if (!user || signedOut) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginPanel, { onSignedIn: () => setPasswordTick((value) => value + 1) }, passwordTick);
	if (me?.mustChangePassword) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangePassword, {
		name: me.name,
		onDone: refreshMe
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfficeContext.Provider, {
		value: {
			me,
			agency,
			setAgency,
			refreshMe
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-screen bg-paper text-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "desk-only fixed inset-y-0 left-0 z-30 w-60 border-r border-line bg-card px-4 py-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgencySwitch, {
							agency,
							setAgency
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "mt-6 grid gap-1",
							children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								...item,
								active: path === item.to || item.to !== "/" && path.startsWith(item.to)
							}, item.to))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm text-muted",
								children: me?.name ?? user.displayName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "road-only sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { compact: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid h-11 w-11 place-items-center rounded-full",
						onClick: () => setOpen(true),
						"aria-label": "Menu",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
					})]
				}),
				open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "road-only fixed inset-0 z-40 bg-ink/40",
					onClick: () => setOpen(false),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex h-full w-72 flex-col bg-card p-4",
						onClick: (event) => event.stopPropagation(),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mb-4 grid h-11 w-11 place-items-center",
								onClick: () => setOpen(false),
								"aria-label": "Close",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgencySwitch, {
								agency,
								setAgency
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
								className: "mt-4 grid gap-1",
								children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
									...item,
									active: path === item.to,
									onClick: () => setOpen(false)
								}, item.to))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-auto flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: me?.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
							})
						]
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "with-sidebar px-4 py-5 pb-24 md:px-8 md:py-8",
					children
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "road-only fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card",
					children: [NAV.slice(0, 4).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: "grid h-16 place-items-center text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-5" }), item.label === "Outstanding" ? "Due" : item.label === "Dashboard" ? "Home" : item.label]
					}, item.to)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "grid h-16 place-items-center text-xs text-muted",
						onClick: () => setOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" }), "More"]
					})]
				})
			]
		})
	});
}
function ChangePassword({ name, onDone }) {
	const [currentPassword, setCurrentPassword] = (0, import_react.useState)("");
	const [nextPassword, setNextPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-paper px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid w-full max-w-md gap-3 rounded-2xl border border-line bg-card p-6",
			onSubmit: (event) => {
				event.preventDefault();
				if (nextPassword !== confirm) {
					setError("The new passwords do not match.");
					return;
				}
				setBusy(true);
				changeOwnPassword({ data: {
					currentPassword,
					nextPassword
				} }).then(() => onDone()).catch((err) => setError(err instanceof Error ? err.message : "Could not change the password")).finally(() => setBusy(false));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl text-pine",
					children: "Choose your password"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [name, ", this is your first sign-in. Set a password only you know."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Password you were given",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						type: "password",
						value: currentPassword,
						onChange: (event) => setCurrentPassword(event.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "New password",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						type: "password",
						value: nextPassword,
						onChange: (event) => setNextPassword(event.target.value),
						required: true,
						minLength: 8
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Repeat the new password",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						type: "password",
						value: confirm,
						onChange: (event) => setConfirm(event.target.value),
						required: true,
						minLength: 8
					})
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-bad",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: buttonClass,
					disabled: busy,
					children: busy ? "Saving…" : "Save password"
				})
			]
		})
	});
}
function Brand({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: compact ? "" : "px-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "/feedy-logo.png?v=2",
			alt: "Feedy",
			className: compact ? "h-14 w-auto" : "h-28 w-auto max-w-full"
		}), compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "Lettings feedback"
		})]
	});
}
function AgencySwitch({ agency, setAgency }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 grid grid-cols-3 gap-1 rounded-full bg-neutral-bg p-1 text-center text-xs",
		children: [
			["all", "Both"],
			["al", "Andrew Lees"],
			["gr", "Gibbins Richards"]
		].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setAgency(id),
			className: `rounded-full px-2 py-2 ${agency === id ? "bg-pine text-pine-ink" : "text-muted"}`,
			children: label
		}, id))
	});
}
function NavLink({ to, label, icon: Icon, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		onClick,
		className: `flex h-11 items-center gap-2 rounded-xl px-3 text-sm ${active ? "bg-pine text-pine-ink" : "text-ink hover:bg-neutral-bg"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
	});
}
function PageTitle({ title, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-5 flex flex-wrap items-end justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl text-ink",
			children: title
		}), action]
	});
}
function Modal({ title, onClose, children, wide = false }) {
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: `flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl bg-card text-ink shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`,
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between border-b border-line px-5 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid h-11 w-11 place-items-center rounded-full hover:bg-neutral-bg",
					onClick: onClose,
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-y-auto px-5 py-4",
				children
			})]
		})
	}), document.body);
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: label
		}), children]
	});
}
var inputClass = "h-11 w-full rounded-xl border border-line bg-card px-3 text-ink outline-none focus:border-pine";
var buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-pine px-4 text-sm text-pine-ink disabled:opacity-50";
var quietClass = "inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm";
function Badge({ tone, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone === "good" ? "bg-good-bg text-good" : tone === "wait" ? "bg-wait-bg text-wait" : tone === "bad" ? "bg-bad-bg text-bad" : "bg-neutral-bg text-muted"}`,
		children
	});
}
function Progress({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-2 overflow-hidden rounded-full bg-neutral-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `h-full ${value >= 80 ? "bg-good" : value >= 50 ? "bg-wait" : "bg-bad"}`,
			style: { width: `${Math.max(0, Math.min(100, value))}%` }
		})
	});
}
function Empty({ title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mx-auto mt-2 max-w-md text-sm text-muted",
			children: body
		})]
	});
}
var styles_default = "/assets/styles-Dq0emMmB.css";
function publicAppHost(hostHeader) {
	const host = String(hostHeader ?? "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
	if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return "";
	if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return "";
	if (host === "vercel.app" || host.endsWith(".vercel.app") || host === "vercel.com" || host.endsWith(".vercel.com")) return "";
	return host;
}
function resolvePublicHost(hostHeader) {
	return publicAppHost(void 0) || publicAppHost(hostHeader);
}
var Route$11 = createRootRoute({
	beforeLoad: async () => {
		let header = "";
		try {
			const { getRequestHeader } = await import("./ssr.mjs").then((n) => n.s).then((n) => n.t);
			header = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "";
		} catch {
			header = "";
		}
		return { publicHost: resolvePublicHost(header) };
	},
	head: ({ match }) => {
		const host = match.context.publicHost;
		const xBanner = host ? `https://${host}/x-banner.jpg` : "";
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{ title: "Feedy" },
				{
					name: "theme-color",
					content: "#007da5"
				},
				...xBanner ? [{
					property: "x:game:image",
					content: xBanner
				}] : []
			],
			links: [
				{
					rel: "icon",
					type: "image/png",
					href: "/feedy-mark.png?v=2"
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
		};
	},
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en-GB",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$9 = () => import("./routes-isIgX2N8.mjs");
var Route$10 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./login-3vXV9j8j.mjs");
var Route$9 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./outstanding-DRHylwtY.mjs");
var Route$8 = createFileRoute("/outstanding")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./properties-Cv1DRjK4.mjs");
var Route$7 = createFileRoute("/properties")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./reports-O0vQCS12.mjs");
var Route$6 = createFileRoute("/reports")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./settings-BwLWu4mH.mjs");
var Route$5 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./staff-Ddp6O1vZ.mjs");
var Route$4 = createFileRoute("/staff")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./viewings-Du82-kCJ.mjs");
var Route$3 = createFileRoute("/viewings")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./properties.index-IRGYNAf_.mjs");
var Route$2 = createFileRoute("/properties/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./properties._propertyId-BGsvWrwj.mjs");
var Route$1 = createFileRoute("/properties/$propertyId")({
	validateSearch: (search) => {
		const feedback = Number(search.feedback);
		return feedback ? { feedback } : {};
	},
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
var LoginRoute = Route$9.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$11
});
var OutstandingRoute = Route$8.update({
	id: "/outstanding",
	path: "/outstanding",
	getParentRoute: () => Route$11
});
var PropertiesRoute = Route$7.update({
	id: "/properties",
	path: "/properties",
	getParentRoute: () => Route$11
});
var ReportsRoute = Route$6.update({
	id: "/reports",
	path: "/reports",
	getParentRoute: () => Route$11
});
var SettingsRoute = Route$5.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$11
});
var StaffRoute = Route$4.update({
	id: "/staff",
	path: "/staff",
	getParentRoute: () => Route$11
});
var ViewingsRoute = Route$3.update({
	id: "/viewings",
	path: "/viewings",
	getParentRoute: () => Route$11
});
var PropertiesIndexRoute = Route$2.update({
	id: "/",
	path: "/",
	getParentRoute: () => PropertiesRoute
});
var PropertiesPropertyIdRoute = Route$1.update({
	id: "/$propertyId",
	path: "/$propertyId",
	getParentRoute: () => PropertiesRoute
});
var ApiAuthSplatRoute = Route.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$11
});
var PropertiesRouteChildren = {
	PropertiesPropertyIdRoute,
	PropertiesIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	LoginRoute,
	OutstandingRoute,
	PropertiesRoute: PropertiesRoute._addFileChildren(PropertiesRouteChildren),
	ReportsRoute,
	SettingsRoute,
	StaffRoute,
	ViewingsRoute,
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
export { saveFeedback as A, listProperties as C, markContacted as D, markApplication as E, sendBranchGmailTest as F, sendFeedback as I, sendGmailTest as L, saveLandlord as M, saveProperty as N, resetStaffPassword as O, saveStaff as P, setLetAgreed as R, importDiary as S, listViewings as T, emailDraft as _, Field as a, getReports as b, Progress as c, quietClass as d, useOffice as f, deleteViewing as g, archiveProperty as h, Empty as i, saveGmailTrial as j, saveBranchGmail as k, buttonClass as l, addViewing as m, Route$1 as n, Modal as o, LoginPanel as p, Badge as r, PageTitle as s, router_exports as t, inputClass as u, getBoard as v, listStaff as w, getSettings as x, getProperty as y };
