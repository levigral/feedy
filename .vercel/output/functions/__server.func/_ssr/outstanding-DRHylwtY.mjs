import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as statusLabel, l as isFeedbackComplete, o as feedbackTone, s as formatUk, t as ageLabel } from "./labels-DDHELNR_.mjs";
import { D as markContacted, d as quietClass, f as useOffice, l as buttonClass, r as Badge, s as PageTitle, v as getBoard } from "./router-BjwAJETe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/outstanding-DRHylwtY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OutstandingPage() {
	const { agency, me } = useOffice();
	const [focus, setFocus] = (0, import_react.useState)(null);
	const [board, setBoard] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (focus != null || !me) return;
		setFocus(me.role === "negotiator" ? me.id : 0);
	}, [me, focus]);
	function load() {
		if (focus == null) return;
		getBoard({ data: {
			agency,
			negotiatorId: focus
		} }).then(setBoard).catch(() => setBoard(null));
	}
	(0, import_react.useEffect)(load, [agency, focus]);
	const people = board?.staff ?? [];
	const chasing = people.filter((person) => person.outstanding > 0);
	const everyone = people.reduce((sum, person) => sum + person.outstanding, 0);
	const queue = board?.queue ?? [];
	const groups = focus === 0 ? chasing : chasing.filter((person) => person.id === focus);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, { title: "Outstanding feedback" }),
		note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-good",
			children: note
		}) : null,
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-bad",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 max-w-2xl text-sm text-muted",
			children: "Each viewing sits with the negotiator who carried it out. Their chased percentage is how many of their viewings have been emailed to the landlord."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `h-11 rounded-full px-4 text-sm ${focus === 0 ? "bg-pine text-pine-ink" : "border border-line bg-card"}`,
				onClick: () => setFocus(0),
				children: ["Everyone · ", everyone]
			}), chasing.map((person) => {
				const chased = person.viewings ? Math.round(person.done / person.viewings * 100) : 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `h-11 rounded-full px-4 text-sm ${focus === person.id ? "bg-pine text-pine-ink" : "border border-line bg-card"}`,
					onClick: () => setFocus(person.id),
					children: [
						person.name,
						" · ",
						person.outstanding,
						" to chase · ",
						chased,
						"%"
					]
				}, person.id);
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-6",
			children: [queue.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No feedback outstanding."
			}) : groups.map((person) => {
				const rows = queue.filter((viewing) => viewing.negotiatorId === person.id);
				if (!rows.length) return null;
				const chased = person.viewings ? Math.round(person.done / person.viewings * 100) : 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: person.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							person.outstanding,
							" to chase · ",
							chased,
							"% chased"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid gap-2",
						children: rows.map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-2xl border border-line bg-card p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/properties/$propertyId",
									params: { propertyId: String(viewing.propertyId) },
									className: "font-medium text-pine",
									children: viewing.address
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										formatUk(viewing.viewedOn),
										" ",
										viewing.time,
										" · ",
										viewing.viewerName || "Viewer not named",
										" · ",
										viewing.days,
										" days"
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									tone: feedbackTone(viewing.status, viewing.days),
									children: [
										ageLabel(viewing.days, viewing.status),
										" · ",
										statusLabel(viewing.status)
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/properties/$propertyId",
									params: { propertyId: String(viewing.propertyId) },
									search: { feedback: viewing.id },
									className: buttonClass,
									children: "Add feedback"
								}), isFeedbackComplete(viewing.status) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex h-11 items-center rounded-full bg-good-bg px-4 text-sm text-good",
									children: "Completed"
								}) : viewing.status === "requested" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex h-11 items-center rounded-full bg-wait-bg px-4 text-sm text-wait",
									children: "Contacted"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: quietClass,
									onClick: () => {
										markContacted({ data: { id: viewing.id } }).then(() => {
											setError("");
											setNote("Marked as contacted. It stays outstanding until the landlord email has been sent.");
											load();
										}).catch((err) => setError(err instanceof Error ? err.message : "Could not mark contacted"));
									},
									children: "Mark contacted"
								})]
							})]
						}, viewing.id))
					})
				] }, person.id);
			}), queue.some((viewing) => !viewing.negotiatorId) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Unassigned"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 grid gap-2",
				children: queue.filter((viewing) => !viewing.negotiatorId).map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-2xl border border-line bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/properties/$propertyId",
						params: { propertyId: String(viewing.propertyId) },
						className: "font-medium text-pine",
						children: viewing.address
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							formatUk(viewing.viewedOn),
							" ",
							viewing.time
						]
					})]
				}, viewing.id))
			})] }) : null]
		})
	] });
}
//#endregion
export { OutstandingPage as component };
