import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as agencyName } from "./labels-DbTtzT8f.mjs";
import { D as saveMailbox, a as Field, b as getSettings, f as useOffice, l as buttonClass, s as PageTitle, u as inputClass } from "./router-CHnq8sEm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-BXCyWQ2f.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const { me } = useOffice();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [message, setMessage] = (0, import_react.useState)("");
	const canEdit = me?.role === "admin" || me?.role === "manager";
	(0, import_react.useEffect)(() => {
		getSettings().then(setRows).catch(() => setRows([]));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, { title: "Settings" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-2xl text-sm text-muted",
			children: "Landlord emails leave from the agency mailbox for that property. Andrew Lees uses bridgwater@andrewleeslettings.co.uk. Gibbins Richards uses lettings@gibbinsrichards.co.uk. Connect each one to Microsoft 365 before Send will leave the office."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
			className: "mt-4 grid max-w-2xl list-decimal gap-2 pl-5 text-sm text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "In Microsoft Entra, register an app in the Microsoft 365 account that owns the mailbox." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Add the application permission Mail.Send and grant admin consent." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Limit the app to these mailboxes with an application access policy." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Paste the tenant ID, application ID and client secret below, then tick send live." })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 grid gap-4",
			children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailboxCard, {
				row,
				canEdit,
				onSaved: (text) => {
					setMessage(text);
					getSettings().then(setRows);
				}
			}, row.agency))
		}),
		message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm",
			children: message
		}) : null
	] });
}
function MailboxCard({ row, canEdit, onSaved }) {
	const [tenantId, setTenantId] = (0, import_react.useState)(row.tenantId);
	const [clientId, setClientId] = (0, import_react.useState)(row.clientId);
	const [clientSecret, setClientSecret] = (0, import_react.useState)("");
	const [live, setLive] = (0, import_react.useState)(row.live);
	const [error, setError] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid gap-3 rounded-2xl border border-line bg-card p-4",
		onSubmit: (event) => {
			event.preventDefault();
			saveMailbox({ data: {
				agency: row.agency,
				tenantId,
				clientId,
				clientSecret,
				live
			} }).then(() => onSaved(`${agencyName(row.agency)} saved`)).catch((err) => setError(err instanceof Error ? err.message : "Could not save"));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: agencyName(row.agency)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `rounded-full px-2 py-1 text-xs ${row.live ? "bg-good-bg text-good" : "bg-wait-bg text-wait"}`,
					children: row.live ? "Connected" : "Not sending yet"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Sends as ", row.fromAddress]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Tenant ID",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: tenantId,
					onChange: (event) => setTenantId(event.target.value),
					disabled: !canEdit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Application ID",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: clientId,
					onChange: (event) => setClientId(event.target.value),
					disabled: !canEdit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Client secret",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: clientSecret,
					placeholder: row.hasSecret ? "Saved — paste a new secret to replace it" : "Paste the secret",
					onChange: (event) => setClientSecret(event.target.value),
					disabled: !canEdit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: live,
					onChange: (event) => setLive(event.target.checked),
					disabled: !canEdit
				}), " Send live via Microsoft Graph"]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: buttonClass,
				children: "Save mailbox"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "A manager needs to save this."
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
