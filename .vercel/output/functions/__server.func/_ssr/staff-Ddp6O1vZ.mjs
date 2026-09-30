import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as formatUk } from "./labels-DDHELNR_.mjs";
import { c as EyeOff, s as Eye } from "../_libs/lucide-react.mjs";
import { P as saveStaff, a as Field, d as quietClass, f as useOffice, l as buttonClass, o as Modal, s as PageTitle, u as inputClass, v as getBoard, w as listStaff } from "./router-BjwAJETe.mjs";
import { t as StaffTable } from "./staff-table-DIY7-soI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/staff-Ddp6O1vZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StaffPage() {
	const { me } = useOffice();
	const [staff, setStaff] = (0, import_react.useState)([]);
	const [queue, setQueue] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const canEdit = me?.role === "admin";
	function load() {
		listStaff().then(setStaff).catch((err) => setError(err instanceof Error ? err.message : "Could not load staff"));
		getBoard({ data: {} }).then((board) => setQueue(board.queue)).catch(() => setQueue([]));
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
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Feedback to chase"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-2xl text-sm text-muted",
			children: "Outstanding viewings are already on the negotiator who did them. Chased is the share of their viewings emailed to the landlord."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid gap-3",
			children: [staff.filter((person) => person.outstanding > 0).map((person) => {
				const chased = person.viewings ? Math.round(person.done / person.viewings * 100) : 0;
				const rows = queue.filter((viewing) => viewing.negotiatorId === person.id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-2xl border border-line bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-medium",
							children: person.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								person.outstanding,
								" to chase · ",
								chased,
								"% chased"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 grid gap-1",
						children: rows.map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/properties/$propertyId",
							params: { propertyId: String(viewing.propertyId) },
							search: { feedback: viewing.id },
							className: "text-sm text-pine",
							children: [
								viewing.address,
								" · ",
								formatUk(viewing.viewedOn),
								" ",
								viewing.time
							]
						}) }, viewing.id))
					})]
				}, person.id);
			}), staff.every((person) => person.outstanding === 0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Nothing left to chase."
			}) : null]
		}),
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
			children: "Only an administrator can add staff or set passwords."
		}),
		editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title: editing === "new" ? "Add staff" : `Edit ${editing.name}`,
			onClose: () => setEditing(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffForm, {
				initial: editing === "new" ? {
					id: 0,
					name: "",
					email: "",
					username: "",
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
	const [username, setUsername] = (0, import_react.useState)(initial.username ?? "");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
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
				username,
				password,
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
				label: "Username",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: username,
					onChange: (event) => setUsername(event.target.value),
					autoComplete: "off",
					required: !initial.id
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: initial.id ? "New password" : "First password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass + " pr-12",
						type: showPassword ? "text" : "password",
						value: password,
						onChange: (event) => setPassword(event.target.value),
						autoComplete: "new-password",
						placeholder: initial.id ? "Leave blank to keep the current password" : "At least 8 characters",
						required: !initial.id,
						minLength: password ? 8 : void 0
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted",
						onClick: () => setShowPassword((value) => !value),
						"aria-label": showPassword ? "Hide password" : "Show password",
						children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "They use this username and password to sign in, then choose their own password the first time."
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
