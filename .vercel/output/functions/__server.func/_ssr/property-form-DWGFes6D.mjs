import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Field, d as quietClass, l as buttonClass, u as inputClass } from "./router-BjwAJETe.mjs";
import { t as UkDateInput } from "./uk-date-CKhc9vku.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/property-form-DWGFes6D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var emptyProperty = {
	address: "",
	postcode: "",
	agency: "al",
	rent: "",
	landlordName: "",
	landlordEmail: "",
	landlordPhone: "",
	landlordEmail2: "",
	landlordName2: "",
	status: "available",
	marketedOn: "",
	negotiatorId: null,
	notes: ""
};
function PropertyForm({ initial, staff, onSave, onCancel }) {
	const [value, setValue] = (0, import_react.useState)(initial);
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	function set(key, next) {
		setValue((current) => ({
			...current,
			[key]: next
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid gap-3",
		onSubmit: (event) => {
			event.preventDefault();
			setBusy(true);
			onSave(value).catch((err) => {
				setError(err instanceof Error ? err.message : "Could not save");
				setBusy(false);
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Address",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.address,
					onChange: (event) => set("address", event.target.value),
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Postcode",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.postcode,
					onChange: (event) => set("postcode", event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Agency",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: inputClass,
					value: value.agency,
					onChange: (event) => set("agency", event.target.value),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "al",
						children: "Andrew Lees Lettings"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "gr",
						children: "Gibbins Richards Lettings"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Advertised rent",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.rent,
					onChange: (event) => set("rent", event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Landlord name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.landlordName,
					onChange: (event) => set("landlordName", event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Landlord email",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.landlordEmail,
					onChange: (event) => set("landlordEmail", event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Second landlord name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.landlordName2,
					onChange: (event) => set("landlordName2", event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Second landlord email",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.landlordEmail2,
					onChange: (event) => set("landlordEmail2", event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Landlord phone",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: value.landlordPhone,
					onChange: (event) => set("landlordPhone", event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Status",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: inputClass,
					value: value.status,
					onChange: (event) => set("status", event.target.value),
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
							value: "withdrawn",
							children: "Withdrawn"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "let",
							children: "Let"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "First marketed",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UkDateInput, {
					value: value.marketedOn,
					onChange: (next) => set("marketedOn", next)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Negotiator",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: inputClass,
					value: value.negotiatorId ?? "",
					onChange: (event) => set("negotiatorId", event.target.value ? Number(event.target.value) : null),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Not assigned"
					}), staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: person.id,
						children: person.name
					}, person.id))]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Notes",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "min-h-24 w-full rounded-xl border border-line p-3",
					value: value.notes,
					onChange: (event) => set("notes", event.target.value)
				})
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
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
export { emptyProperty as n, PropertyForm as t };
