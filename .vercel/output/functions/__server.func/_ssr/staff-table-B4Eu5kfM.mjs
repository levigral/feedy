import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/staff-table-B4Eu5kfM.js
var import_jsx_runtime = require_jsx_runtime();
function StaffTable({ staff }) {
	if (!staff.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-sm text-muted",
		children: "Staff appear here once a diary names them, or you add them."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 overflow-hidden rounded-2xl border border-line bg-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-left text-sm",
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
						children: "Done"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Due"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-3 font-medium",
						children: "Per let"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-t border-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-3",
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-3",
						children: [person.lets ? `${Math.round(person.viewings / person.lets * 10) / 10} viewings` : "No let yet", person.avgDays != null ? ` · ${person.avgDays} days` : ""]
					})
				]
			}, person.id)) })]
		})
	});
}
//#endregion
export { StaffTable as t };
