import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as feedbackTone, c as statusLabel, o as formatUk, t as ageLabel } from "./labels-DbTtzT8f.mjs";
import { T as markContacted, _ as getBoard, d as quietClass, f as useOffice, l as buttonClass, r as Badge, s as PageTitle } from "./router-CHnq8sEm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/outstanding-ZQjpmSiq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OutstandingPage() {
	const { agency } = useOffice();
	const [focus, setFocus] = (0, import_react.useState)(0);
	const [board, setBoard] = (0, import_react.useState)(null);
	function load() {
		getBoard({ data: {
			agency,
			negotiatorId: focus
		} }).then(setBoard).catch(() => setBoard(null));
	}
	(0, import_react.useEffect)(load, [agency, focus]);
	const people = (board?.staff ?? []).filter((person) => person.outstanding > 0);
	const queue = board?.queue ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, { title: "Outstanding feedback" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 max-w-2xl text-sm text-muted",
			children: "Morning meeting list. Oldest viewings first. Tap a negotiator to see only their follow-ups."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `h-11 rounded-full px-4 text-sm ${focus === 0 ? "bg-pine text-pine-ink" : "border border-line bg-card"}`,
				onClick: () => setFocus(0),
				children: ["Everyone · ", board?.attention ?? 0]
			}), people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `h-11 rounded-full px-4 text-sm ${focus === person.id ? "bg-pine text-pine-ink" : "border border-line bg-card"}`,
				onClick: () => setFocus(person.id),
				children: [
					person.name,
					" · ",
					person.outstanding
				]
			}, person.id))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-2",
			children: queue.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No feedback outstanding."
			}) : queue.map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl border border-line bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: viewing.negotiatorName || "Unassigned"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: viewing.address }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
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
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
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
						className: buttonClass,
						children: "Add feedback"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: quietClass,
						onClick: () => {
							markContacted({ data: { id: viewing.id } }).then(load);
						},
						children: "Mark contacted"
					})]
				})]
			}, viewing.id))
		})
	] });
}
//#endregion
export { OutstandingPage as component };
