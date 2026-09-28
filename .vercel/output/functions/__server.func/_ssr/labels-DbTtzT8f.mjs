import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/labels-DbTtzT8f.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-CVqXY6bk.mjs").then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-BHHvf9OQ.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
var AGENCIES = [{
	id: "al",
	name: "Andrew Lees Lettings",
	email: "bridgwater@andrewleeslettings.co.uk"
}, {
	id: "gr",
	name: "Gibbins Richards Lettings",
	email: "lettings@gibbinsrichards.co.uk"
}];
function agencyName(id) {
	return AGENCIES.find((agency) => agency.id === id)?.name ?? "Agency";
}
function agencyEmail(id) {
	return AGENCIES.find((agency) => agency.id === id)?.email ?? "";
}
function statusLabel(status) {
	switch (status) {
		case "available": return "Available";
		case "let_agreed": return "Let agreed";
		case "withdrawn": return "Withdrawn";
		case "let": return "Let";
		case "awaiting": return "Awaiting feedback";
		case "requested": return "Feedback requested";
		case "received": return "Feedback received";
		case "sent": return "Feedback sent to landlord";
		case "no_response": return "No response";
		case "interested": return "Applicant interested";
		case "not_interested": return "Applicant not interested";
		case "very_interested": return "Very interested";
		case "undecided": return "Undecided";
		default: return status;
	}
}
function isFeedbackComplete(status) {
	return [
		"received",
		"sent",
		"interested",
		"not_interested"
	].includes(status);
}
function feedbackTone(status, days) {
	if (isFeedbackComplete(status)) return "good";
	if (status === "requested") return "wait";
	if (days >= 1) return "bad";
	return "neutral";
}
function ageLabel(days, status) {
	if (isFeedbackComplete(status)) return "Done";
	if (days >= 2) return "Overdue";
	if (days >= 1) return "Outstanding";
	return "Today";
}
var MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
function formatUk(iso) {
	if (!iso) return "";
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	if (!match) return iso;
	return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}
function todayIso() {
	const now = /* @__PURE__ */ new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
//#endregion
export { feedbackTone as a, statusLabel as c, authMiddleware as i, todayIso as l, agencyEmail as n, formatUk as o, agencyName as r, isFeedbackComplete as s, ageLabel as t };
