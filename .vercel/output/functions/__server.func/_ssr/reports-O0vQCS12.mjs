import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as statusLabel, s as formatUk } from "./labels-DDHELNR_.mjs";
import { b as getReports, c as Progress, f as useOffice, s as PageTitle, u as inputClass } from "./router-BjwAJETe.mjs";
import { t as UkDateInput } from "./uk-date-CKhc9vku.mjs";
import { t as StaffTable } from "./staff-table-DIY7-soI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-O0vQCS12.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReportsPage() {
	const { agency } = useOffice();
	const [from, setFrom] = (0, import_react.useState)("");
	const [to, setTo] = (0, import_react.useState)("");
	const [report, setReport] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let live = true;
		getReports({ data: {
			agency,
			from,
			to
		} }).then((value) => {
			if (live) setReport(value);
		}).catch(() => {
			if (live) setReport(null);
		});
		return () => {
			live = false;
		};
	}, [
		agency,
		from,
		to
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, { title: "Reports" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UkDateInput, {
				className: inputClass + " max-w-44",
				value: from,
				onChange: setFrom
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UkDateInput, {
				className: inputClass + " max-w-44",
				value: to,
				onChange: setTo
			})]
		}),
		report ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-display text-3xl",
				children: [report.percent, "% emailed to the landlord"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [report.viewings, " viewings in this range"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 max-w-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: report.percent })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-2xl",
				children: "By property"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 grid gap-2",
				children: report.byProperty.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between rounded-xl bg-card px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.address }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [
							row.viewings,
							" viewings · ",
							statusLabel(row.status)
						]
					})]
				}, row.address))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-2xl",
				children: "Still to let, most viewings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 grid gap-2",
				children: report.stillAvailable.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between rounded-xl bg-card px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.address }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.viewings })]
				}, row.address))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-2xl",
				children: "Interested"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 grid gap-2",
				children: report.interested.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl bg-card px-3 py-2 text-sm",
					children: [
						row.viewer || "Viewer",
						" · ",
						row.address,
						" · ",
						formatUk(row.date),
						" · ",
						statusLabel(row.interest)
					]
				}, `${row.address}-${index}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-2xl",
				children: "Why people did not proceed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 grid gap-2",
				children: report.reasons.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-muted",
					children: "Nothing recorded yet."
				}) : report.reasons.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl bg-card px-3 py-2 text-sm",
					children: [
						row.reason,
						" · ",
						row.count
					]
				}, row.reason))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-2xl",
				children: "Staff"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffTable, { staff: report.staff })
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: "Loading reports…"
		})
	] });
}
//#endregion
export { ReportsPage as component };
