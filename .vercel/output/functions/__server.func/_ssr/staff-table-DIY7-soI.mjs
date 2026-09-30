import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/staff-table-DIY7-soI.js
var import_jsx_runtime = require_jsx_runtime();
function StaffTable({ staff }) {
	if (!staff.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-sm text-muted",
		children: "Staff appear here once a diary names them, or you add them."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-xs text-muted md:hidden",
			children: "Swipe sideways to see the conversion rate."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto rounded-2xl border border-line bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[40rem] text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-3 font-medium",
							children: "Negotiator"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-3 font-medium",
							children: "Viewings"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-3 font-medium",
							children: "Emailed"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-3 font-medium",
							children: "To chase"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "whitespace-nowrap px-3 py-3 font-medium",
							children: "Chased"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "whitespace-nowrap px-3 py-3 font-medium",
							children: "Properties let"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "whitespace-nowrap px-3 py-3 font-medium",
							children: "Conversion"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap px-3 py-3",
							children: person.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-3",
							children: person.viewings
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-3",
							children: person.done
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-3",
							children: person.outstanding
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap px-3 py-3",
							children: person.viewings ? `${Math.round(person.done / person.viewings * 100)}%` : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-3",
							children: person.lets
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "whitespace-nowrap px-3 py-3",
							children: person.viewings ? `${Math.round(person.lets / person.viewings * 100)}%` : "—"
						})
					]
				}, person.id)) })]
			})
		})]
	});
}
//#endregion
export { StaffTable as t };
