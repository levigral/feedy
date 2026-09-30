import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as statusLabel, r as agencyName } from "./labels-DDHELNR_.mjs";
import { C as listProperties, N as saveProperty, f as useOffice, l as buttonClass, o as Modal, s as PageTitle, u as inputClass, w as listStaff } from "./router-BjwAJETe.mjs";
import { n as emptyProperty, t as PropertyForm } from "./property-form-DWGFes6D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/properties.index-IRGYNAf_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PropertiesPage() {
	const { agency } = useOffice();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [staff, setStaff] = (0, import_react.useState)([]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("available");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	function load() {
		listProperties().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Could not load properties"));
		listStaff().then(setStaff).catch(() => void 0);
	}
	(0, import_react.useEffect)(load, []);
	(0, import_react.useEffect)(() => {
		if (window.location.hash === "#add") setOpen(true);
	}, []);
	const visible = rows.filter((row) => {
		if (agency !== "all" && row.agency !== agency) return false;
		if (status !== "all" && row.status !== status) return false;
		return `${row.address} ${row.postcode} ${row.landlordName}`.toLowerCase().includes(query.toLowerCase());
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			title: "Properties",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: buttonClass,
				onClick: () => setOpen(true),
				children: "Add property"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: inputClass + " max-w-sm",
				placeholder: "Search address or landlord",
				value: query,
				onChange: (event) => setQuery(event.target.value)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: inputClass + " max-w-48",
				value: status,
				onChange: (event) => setStatus(event.target.value),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "available",
						children: "Available"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "let_agreed",
						children: "Let agreed"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "let",
						children: "Let"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "withdrawn",
						children: "Withdrawn"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "all",
						children: "All statuses"
					})
				]
			})]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-bad",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-2",
			children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No properties on this list. Import a diary or add one."
			}) : visible.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/properties/$propertyId",
				params: { propertyId: String(row.id) },
				className: "rounded-2xl border border-line bg-card p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: row.address
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							agencyName(row.agency),
							" · ",
							row.landlordName || "Landlord to be added",
							" · ",
							row.viewings,
							" viewings"
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm",
						children: statusLabel(row.status)
					})]
				})
			}, row.id))
		}),
		open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title: "Add property",
			onClose: () => setOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyForm, {
				staff,
				initial: {
					...emptyProperty,
					agency: agency === "gr" ? "gr" : "al"
				},
				onCancel: () => setOpen(false),
				onSave: async (value) => {
					await saveProperty({ data: value });
					setOpen(false);
					load();
				}
			})
		}) : null
	] });
}
//#endregion
export { PropertiesPage as component };
