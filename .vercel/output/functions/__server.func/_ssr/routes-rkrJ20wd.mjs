import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as feedbackTone, c as statusLabel, o as formatUk, t as ageLabel } from "./labels-DbTtzT8f.mjs";
import { _ as getBoard, c as Progress, f as useOffice, i as Empty, l as buttonClass, r as Badge, s as PageTitle } from "./router-CHnq8sEm.mjs";
import { t as StaffTable } from "./staff-table-B4Eu5kfM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-rkrJ20wd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const { agency } = useOffice();
	const [range, setRange] = (0, import_react.useState)("all");
	const [negotiatorId, setNegotiatorId] = (0, import_react.useState)(0);
	const [board, setBoard] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let live = true;
		getBoard({ data: {
			agency,
			range,
			negotiatorId
		} }).then((value) => {
			if (live) setBoard(value);
		}).catch((err) => {
			if (live) setError(err instanceof Error ? err.message : "Could not load the dashboard");
		});
		return () => {
			live = false;
		};
	}, [
		agency,
		range,
		negotiatorId
	]);
	const cards = board ? [
		["Active properties", String(board.activeProperties)],
		["Viewings", String(board.viewings)],
		["Feedback done", String(board.done)],
		["Outstanding", String(board.outstanding)],
		["Completion", `${board.percent}%`],
		["Interested", String(board.interested)]
	] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			title: "Dashboard",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/viewings",
				className: buttonClass,
				children: "Import diary"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: [[
				"all",
				"today",
				"week",
				"month"
			].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `h-11 rounded-full px-4 text-sm ${range === item ? "bg-pine text-pine-ink" : "bg-card border border-line"}`,
				onClick: () => setRange(item),
				children: item === "all" ? "All" : item === "today" ? "Today" : item === "week" ? "This week" : "This month"
			}, item)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "h-11 rounded-full border border-line bg-card px-3",
				value: negotiatorId,
				onChange: (event) => setNegotiatorId(Number(event.target.value)),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: 0,
					children: "Everyone"
				}), board?.staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: person.id,
					children: person.name
				}, person.id))]
			})]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-bad",
			children: error
		}) : null,
		board?.attention ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/outstanding",
			className: "mb-4 flex items-center justify-between rounded-2xl bg-bad-bg px-4 py-3 text-bad",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [board.attention, " viewing feedbacks need attention"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open the list" })]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
			children: cards.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl border border-line bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl",
					children: value
				})]
			}, label))
		}),
		board ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: board.percent })
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Outstanding feedback"
		}),
		!board ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-muted",
			children: "Loading…"
		}) : board.queue.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
				title: "Nothing waiting",
				body: "Drop a diary on Viewings. Each viewing stays here until feedback is in."
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid gap-2",
			children: board.queue.slice(0, 8).map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/properties/$propertyId",
				params: { propertyId: String(viewing.propertyId) },
				className: "grid gap-1 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: viewing.address
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						viewing.negotiatorName || "Unassigned",
						" · ",
						formatUk(viewing.viewedOn),
						" ",
						viewing.time,
						" · ",
						viewing.viewerName || "Viewer not named"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: feedbackTone(viewing.status, viewing.days),
					children: [
						ageLabel(viewing.days, viewing.status),
						" · ",
						statusLabel(viewing.status)
					]
				})]
			}, viewing.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Viewings per let"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffTable, { staff: board?.staff ?? [] })
	] });
}
//#endregion
export { Dashboard as component };
