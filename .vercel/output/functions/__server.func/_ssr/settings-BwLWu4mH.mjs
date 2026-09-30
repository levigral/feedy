import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as agencyName } from "./labels-DDHELNR_.mjs";
import { c as EyeOff, s as Eye } from "../_libs/lucide-react.mjs";
import { F as sendBranchGmailTest, L as sendGmailTest, O as resetStaffPassword, a as Field, f as useOffice, j as saveGmailTrial, k as saveBranchGmail, l as buttonClass, s as PageTitle, u as inputClass, w as listStaff, x as getSettings } from "./router-BjwAJETe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-BwLWu4mH.js
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
		me?.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordReset, { onSaved: setMessage }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted",
			children: "Only an administrator can reset a password."
		}),
		message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-good",
			children: message
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-2xl text-sm text-muted",
			children: "Add a separate Gmail address for each branch. An Andrew Lees viewing sends from the Andrew Lees Gmail. A Gibbins Richards viewing sends from the Gibbins Richards Gmail."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-4",
			children: rows.filter((row) => row.agency === "al" || row.agency === "gr").map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BranchGmail, {
				row,
				canEdit,
				onSaved: (text) => {
					setMessage(text);
					getSettings().then(setRows);
				}
			}, row.agency))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 max-w-2xl text-sm text-muted",
			children: "The box below is only a backup. Use it if you want one Gmail for both branches. A branch with its own Gmail switched on will not use this."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GmailTrial, {
			row: rows.find((row) => row.agency === "gmail"),
			canEdit,
			onSaved: (text) => {
				setMessage(text);
				getSettings().then(setRows);
			}
		})
	] });
}
function PasswordReset({ onSaved }) {
	const [people, setPeople] = (0, import_react.useState)([]);
	const [id, setId] = (0, import_react.useState)(0);
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		listStaff().then((rows) => {
			setPeople(rows);
			const first = rows.find((person) => person.username);
			if (first) setId(first.id);
		}).catch(() => setPeople([]));
	}, []);
	const chosen = people.find((person) => person.id === id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mb-8 grid max-w-2xl gap-3 rounded-2xl border border-line bg-card p-4",
		onSubmit: (event) => {
			event.preventDefault();
			setBusy(true);
			setError("");
			resetStaffPassword({ data: {
				id,
				password
			} }).then((result) => {
				setPassword("");
				onSaved(`Password reset for ${result.name}. Tell them the new one. They will choose their own the next time they sign in.`);
			}).catch((err) => setError(err instanceof Error ? err.message : "Could not reset the password")).finally(() => setBusy(false));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Reset a password"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "If someone has forgotten their login, set a new password here and tell them what it is."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Staff member",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: inputClass,
					value: id,
					onChange: (event) => setId(Number(event.target.value)),
					children: people.filter((person) => person.username).map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: person.id,
						children: [
							person.name,
							" · ",
							person.username
						]
					}, person.id))
				})
			}),
			people.some((person) => person.username) ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No one has a username yet. Add one on the Staff page first."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "New password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass + " pr-12",
						type: showPassword ? "text" : "password",
						value: password,
						onChange: (event) => setPassword(event.target.value),
						minLength: 8,
						required: true,
						autoComplete: "new-password"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted",
						onClick: () => setShowPassword((value) => !value),
						"aria-label": showPassword ? "Hide password" : "Show password",
						children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
					})]
				})
			}),
			chosen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"They sign in as ",
					chosen.username,
					"."
				]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: buttonClass,
				disabled: busy || !id,
				children: busy ? "Saving…" : "Reset password"
			})
		]
	});
}
function GmailTrial({ row, canEdit, onSaved }) {
	const [address, setAddress] = (0, import_react.useState)(row?.fromAddress ?? "");
	const [appPassword, setAppPassword] = (0, import_react.useState)("");
	const [live, setLive] = (0, import_react.useState)(row?.live ?? false);
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setAddress(row?.fromAddress ?? "");
		setLive(row?.live ?? false);
	}, [row?.fromAddress, row?.live]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-4 grid max-w-2xl gap-3 rounded-2xl border border-line bg-card p-4",
		onSubmit: (event) => {
			event.preventDefault();
			setBusy(true);
			saveGmailTrial({ data: {
				address,
				appPassword,
				live
			} }).then(() => onSaved(live ? "Gmail trial is on" : "Gmail trial saved, but not sending")).catch((err) => setError(err instanceof Error ? err.message : "Could not save")).finally(() => setBusy(false));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Gmail trial"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `rounded-full px-2 py-1 text-xs ${row?.live ? "bg-good-bg text-good" : "bg-wait-bg text-wait"}`,
					children: row?.live ? "Sending from Gmail" : "Not sending yet"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "grid list-decimal gap-1 pl-5 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "On the Google account, turn on 2-Step Verification." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Open Google Account, search for App passwords, and create one named Feedy." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Paste that 16-character password below. Do not use your normal Gmail password." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tick send from this Gmail, save, then send a test to yourself." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Gmail address",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: address,
					placeholder: "name@gmail.com",
					onChange: (event) => setAddress(event.target.value),
					disabled: !canEdit
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "App password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: appPassword,
					placeholder: row?.hasSecret ? "Saved — paste a new one to replace it" : "16-character app password",
					onChange: (event) => setAppPassword(event.target.value),
					disabled: !canEdit,
					autoComplete: "off"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: live,
					onChange: (event) => setLive(event.target.checked),
					disabled: !canEdit
				}), " Send landlord emails from this Gmail"]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: buttonClass,
					disabled: busy,
					children: "Save Gmail trial"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 rounded-full border border-line px-4 text-sm",
					disabled: busy,
					onClick: () => {
						setBusy(true);
						setError("");
						sendGmailTest({ data: {
							address,
							appPassword
						} }).then(() => onSaved(`Test sent to ${address}`)).catch((err) => setError(err instanceof Error ? err.message : "Gmail refused the test")).finally(() => setBusy(false));
					},
					children: "Send a test to me"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "A manager needs to save this."
			})
		]
	});
}
function BranchGmail({ row, canEdit, onSaved }) {
	const savedGmail = row.kind === "smtp" && /@gmail\.com$|@googlemail\.com$/i.test(row.fromAddress);
	const [address, setAddress] = (0, import_react.useState)(savedGmail ? row.fromAddress : "");
	const [appPassword, setAppPassword] = (0, import_react.useState)("");
	const [live, setLive] = (0, import_react.useState)(savedGmail ? row.live : false);
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setAddress(savedGmail ? row.fromAddress : "");
		setLive(savedGmail ? row.live : false);
	}, [
		row.fromAddress,
		row.live,
		row.kind,
		savedGmail
	]);
	const ready = savedGmail && row.live;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid max-w-2xl gap-3 rounded-2xl border border-line bg-card p-4",
		onSubmit: (event) => {
			event.preventDefault();
			setBusy(true);
			setError("");
			saveBranchGmail({ data: {
				agency: row.agency,
				address,
				appPassword,
				live
			} }).then(() => onSaved(live ? `${agencyName(row.agency)} will send from ${address}` : `${agencyName(row.agency)} saved, but not sending yet`)).catch((err) => setError(err instanceof Error ? err.message : "Could not save")).finally(() => setBusy(false));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: agencyName(row.agency)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `rounded-full px-2 py-1 text-xs ${ready ? "bg-good-bg text-good" : "bg-wait-bg text-wait"}`,
					children: ready ? "Sending from this Gmail" : "Not sending yet"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Create an app password in this Gmail account at Google Account, then App passwords. Name it Feedy. Do not use the normal Gmail password."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Gmail address",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					type: "email",
					value: address,
					placeholder: "name@gmail.com",
					onChange: (event) => setAddress(event.target.value),
					disabled: !canEdit,
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "App password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					value: appPassword,
					placeholder: savedGmail && row.hasSecret ? "Saved — paste a new one to replace it" : "16-character app password",
					onChange: (event) => setAppPassword(event.target.value),
					disabled: !canEdit,
					autoComplete: "off"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: live,
					onChange: (event) => setLive(event.target.checked),
					disabled: !canEdit
				}), " Send feedback from this Gmail"]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: buttonClass,
					disabled: busy,
					children: busy ? "Saving…" : "Save this Gmail"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 rounded-full border border-line px-4 text-sm",
					disabled: busy,
					onClick: () => {
						setBusy(true);
						setError("");
						sendBranchGmailTest({ data: {
							agency: row.agency,
							address,
							appPassword
						} }).then(() => onSaved(`Test sent to ${address}`)).catch((err) => setError(err instanceof Error ? err.message : "Gmail refused the test")).finally(() => setBusy(false));
					},
					children: "Send a test to this Gmail"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "A manager needs to save this."
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
