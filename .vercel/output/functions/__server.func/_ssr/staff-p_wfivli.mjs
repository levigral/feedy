import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as listStaff, a as Field, d as quietClass, f as useOffice, k as saveStaff, l as buttonClass, o as Modal, s as PageTitle, u as inputClass } from "./router-CHnq8sEm.mjs";
import { t as StaffTable } from "./staff-table-B4Eu5kfM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/staff-p_wfivli.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StaffPage() {
	const { me } = useOffice();
	const [staff, setStaff] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const canEdit = me?.role === "admin" || me?.role === "manager";
	function load() {
		listStaff().then(setStaff).catch((err) => setError(err instanceof Error ? err.message : "Could not load staff"));
	}
	(0, import_react.useEffect)(load, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			title: "Staff",
			action: canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: buttonClass,
				onClick: () => setEditing("new"),
				children: "Add staff"
			}) : null
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-bad",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffTable, { staff }),
		canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 grid gap-2",
			children: staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: quietClass,
				onClick: () => setEditing(person),
				children: ["Edit ", person.name]
			}) }, person.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: "A manager can add and edit staff. Diary imports still add a negotiator when a new name appears."
		}),
		editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title: editing === "new" ? "Add staff" : `Edit ${editing.name}`,
			onClose: () => setEditing(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffForm, {
				initial: editing === "new" ? {
					id: 0,
					name: "",
					email: "",
					role: "negotiator",
					agency: "al",
					active: true
				} : editing,
				onCancel: () => setEditing(null),
				onSave: async (value) => {
					await saveStaff({ data: value });
					setEditing(null);
					load();
				}
			})
		}) : null
	] });
}
function StaffForm({ initial, onSave, onCancel }) {
	const [name, setName] = (0, import_react.useState)(initial.name);
	const [email, setEmail] = (0, import_react.useState)(initial.email);
	const [role, setRole] = (0, import_react.useState)(initial.role);
	const [agency, setAgency] = (0, import_react.useState)(initial.agency);
	const [active, setActive] = (0, import_react.useState)(initial.active);
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid gap-3",
		onSubmit: (event) => {
			event.preventDefault();
			setBusy(true);
			onSave({
				id: initial.id || void 0,
				name,
				email,
				role,
				agency,
				active
			}).catch((err) => {
				setError(err instanceof Error ? err.message : "Could not save");
				setBusy(false);
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: name,
					onChange: (event) => setName(event.target.value),
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Email",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: email,
					onChange: (event) => setEmail(event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Role",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: inputClass,
					value: role,
					onChange: (event) => setRole(event.target.value),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "negotiator",
							children: "Negotiator"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "manager",
							children: "Manager"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "admin",
							children: "Administrator"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Agency",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: inputClass,
					value: agency,
					onChange: (event) => setAgency(event.target.value),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "al",
						children: "Andrew Lees Lettings"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "gr",
						children: "Gibbins Richards Lettings"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: active,
					onChange: (event) => setActive(event.target.checked)
				}), " Account active"]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky bottom-0 flex gap-2 bg-card py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: buttonClass,
					disabled: busy,
					children: busy ? "Saving…" : "Save"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: quietClass,
					onClick: onCancel,
					children: "Cancel"
				})]
			})
		]
	});
}
//#endregion
export { StaffPage as component };
