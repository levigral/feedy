import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as feedbackTone, c as statusLabel, l as todayIso, n as agencyEmail, o as formatUk, r as agencyName, t as ageLabel } from "./labels-DbTtzT8f.mjs";
import { A as sendFeedback, C as listStaff, E as saveFeedback, O as saveProperty, T as markContacted, a as Field, c as Progress, d as quietClass, f as useOffice, g as emailDraft, h as archiveProperty, j as setLetAgreed, l as buttonClass, m as addViewing, n as Route$1, o as Modal, r as Badge, u as inputClass, v as getProperty } from "./router-CHnq8sEm.mjs";
import { t as PropertyForm } from "./property-form-BFNbGt7w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/properties._propertyId-CzwV8fz6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NOTES = [
	["overall", "Overall impression"],
	["condition", "Property condition"],
	["decoration", "Decoration"],
	["kitchen", "Kitchen"],
	["bathroom", "Bathroom"],
	["bedrooms", "Bedrooms"],
	["garden", "Garden / outside"],
	["location", "Location"],
	["parking", "Parking"],
	["price", "Rental price"],
	["size", "Size"],
	["cleanliness", "Cleanliness"],
	["maintenance", "Maintenance concerns"],
	["improvements", "Suggested improvements"],
	["reasons", "Reasons for not proceeding"],
	["other", "Other comments"]
];
function PropertyPage() {
	const { propertyId } = Route$1.useParams();
	const { me } = useOffice();
	const [data, setData] = (0, import_react.useState)(null);
	const [staff, setStaff] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [viewingOpen, setViewingOpen] = (0, import_react.useState)(false);
	const [feedbackId, setFeedbackId] = (0, import_react.useState)(null);
	const [mailId, setMailId] = (0, import_react.useState)(null);
	const [letOpen, setLetOpen] = (0, import_react.useState)(false);
	function load() {
		getProperty({ data: { id: Number(propertyId) } }).then(setData).catch((err) => setError(err instanceof Error ? err.message : "Could not open this property"));
		listStaff().then(setStaff).catch(() => void 0);
	}
	(0, import_react.useEffect)(load, [propertyId]);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-bad",
		children: error
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted",
		children: "Loading property…"
	});
	const property = data.property;
	const percent = property.viewings ? Math.round(property.feedbackDone / property.viewings * 100) : 0;
	const letDays = property.letAgreedOn && property.firstViewing ? daysBetween(property.firstViewing, property.letAgreedOn) : null;
	const feedbackViewing = data.viewings.find((row) => row.id === feedbackId) ?? null;
	const mailViewing = data.viewings.find((row) => row.id === mailId) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/properties",
			className: "text-sm text-muted",
			children: "All properties"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: property.address
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					agencyName(property.agency),
					" · ",
					statusLabel(property.status),
					" · ",
					property.postcode
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: buttonClass,
					onClick: () => setViewingOpen(true),
					children: "Add viewing"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: quietClass,
					onClick: () => setEditing(true),
					children: "Edit"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 grid gap-3 sm:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl border border-line bg-card p-4 sm:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl",
						children: property.status === "let_agreed" || property.status === "let" ? `${property.viewings} viewings to let` : `${property.viewings} viewings so far`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							property.feedbackDone,
							" feedback completed · ",
							property.viewings - property.feedbackDone,
							" outstanding · ",
							percent,
							"%"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: percent })
					}),
					property.letAgreedOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm",
						children: [
							"Agreed by ",
							property.letAgreedByName || "staff",
							" on ",
							formatUk(property.letAgreedOn),
							letDays != null ? ` · ${letDays} days from the first viewing` : ""
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: property.status === "let_agreed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quietClass,
							onClick: () => {
								setLetAgreed({ data: {
									id: property.id,
									staffId: me?.id ?? 0,
									on: todayIso(),
									revert: true
								} }).then(load);
							},
							children: "Put back on the market"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quietClass,
							onClick: () => setLetOpen(true),
							children: "Mark let agreed"
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl border border-line bg-card p-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: property.landlordName || "Landlord to be added"
					}),
					property.landlordPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "mt-1 block text-pine",
						href: `tel:${property.landlordPhone}`,
						children: property.landlordPhone
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-muted",
						children: "No phone yet"
					}),
					property.landlordEmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "block text-pine",
						href: `mailto:${property.landlordEmail}`,
						children: property.landlordEmail
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted",
						children: "No email yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-muted",
						children: ["Rent ", property.rent || "not set"]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Viewings"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid gap-2",
			children: data.viewings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No viewings yet."
			}) : data.viewings.map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl border border-line bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium",
							children: [
								formatUk(viewing.viewedOn),
								" ",
								viewing.time,
								" · ",
								viewing.viewerName || "Viewer not named"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: viewing.negotiatorName || "Unassigned"
						}),
						viewing.feedbackText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm",
							children: viewing.feedbackText
						}) : null
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						tone: feedbackTone(viewing.status, viewing.days),
						children: [
							ageLabel(viewing.days, viewing.status),
							" · ",
							statusLabel(viewing.status)
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: buttonClass,
							onClick: () => setFeedbackId(viewing.id),
							children: "Add feedback"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quietClass,
							onClick: () => {
								markContacted({ data: { id: viewing.id } }).then(load);
							},
							children: "Mark contacted"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quietClass,
							onClick: () => setMailId(viewing.id),
							children: "Email landlord"
						})
					]
				})]
			}, viewing.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Activity"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 grid gap-2",
			children: data.activity.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl bg-card px-3 py-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: item.kind
					}),
					" · ",
					item.detail,
					" · ",
					item.actor
				]
			}, `${item.at}-${index}`))
		}),
		data.emails.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Emails"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 grid gap-2",
			children: data.emails.map((email) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl bg-card px-3 py-2 text-sm",
				children: [
					email.status === "sent" ? "Sent" : "Not sent",
					" from ",
					email.from,
					" to ",
					email.to,
					" · ",
					email.sender,
					email.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-bad",
						children: email.error
					}) : null
				]
			}, email.id))
		})] }) : null,
		editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
			title: "Edit property",
			onClose: () => setEditing(false),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyForm, {
				staff,
				initial: {
					id: property.id,
					address: property.address,
					postcode: property.postcode,
					agency: property.agency,
					rent: property.rent,
					landlordName: property.landlordName,
					landlordEmail: property.landlordEmail,
					landlordPhone: property.landlordPhone,
					landlordEmail2: property.landlordEmail2,
					status: property.status,
					marketedOn: property.marketedOn ?? "",
					negotiatorId: property.negotiatorId,
					notes: property.notes
				},
				onCancel: () => setEditing(false),
				onSave: async (value) => {
					await saveProperty({ data: value });
					setEditing(false);
					load();
				}
			}), me?.role === "admin" || me?.role === "manager" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 text-sm text-bad",
				onClick: () => {
					archiveProperty({ data: { id: property.id } }).then(() => {
						setEditing(false);
						load();
					});
				},
				children: "Withdraw this property"
			}) : null]
		}) : null,
		viewingOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewingModal, {
			propertyId: property.id,
			staff,
			defaultStaff: me?.id ?? 0,
			onClose: () => setViewingOpen(false),
			onSaved: () => {
				setViewingOpen(false);
				load();
			}
		}) : null,
		feedbackViewing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedbackModal, {
			viewing: feedbackViewing,
			onClose: () => setFeedbackId(null),
			onSaved: () => {
				setFeedbackId(null);
				load();
			}
		}) : null,
		mailViewing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailModal, {
			viewing: mailViewing,
			meName: me?.name ?? "",
			onClose: () => setMailId(null),
			onSaved: () => {
				setMailId(null);
				load();
			}
		}) : null,
		letOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			title: "Mark let agreed",
			onClose: () => setLetOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LetForm, {
				staff,
				defaultStaff: property.negotiatorId ?? me?.id ?? 0,
				onCancel: () => setLetOpen(false),
				onSave: async (staffId, on) => {
					await setLetAgreed({ data: {
						id: property.id,
						staffId,
						on
					} });
					setLetOpen(false);
					load();
				}
			})
		}) : null
	] });
}
function daysBetween(from, to) {
	const start = Date.parse(`${from}T00:00:00Z`);
	const end = Date.parse(`${to}T00:00:00Z`);
	return Math.round((end - start) / 864e5);
}
function ViewingModal({ propertyId, staff, defaultStaff, onClose, onSaved }) {
	const [date, setDate] = (0, import_react.useState)(todayIso());
	const [time, setTime] = (0, import_react.useState)("");
	const [viewerName, setViewerName] = (0, import_react.useState)("");
	const [viewerPhone, setViewerPhone] = (0, import_react.useState)("");
	const [viewerEmail, setViewerEmail] = (0, import_react.useState)("");
	const [negotiatorId, setNegotiatorId] = (0, import_react.useState)(defaultStaff);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [immediate, setImmediate] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		title: "Add viewing",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3",
			onSubmit: (event) => {
				event.preventDefault();
				addViewing({ data: {
					propertyId,
					date,
					time,
					viewerName,
					viewerPhone,
					viewerEmail,
					negotiatorId,
					notes,
					immediate
				} }).then(onSaved).catch((err) => setError(err instanceof Error ? err.message : "Could not save"));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						type: "date",
						value: date,
						onChange: (event) => setDate(event.target.value),
						required: true
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Time",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						value: time,
						onChange: (event) => setTime(event.target.value),
						placeholder: "10:30"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Viewer",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						value: viewerName,
						onChange: (event) => setViewerName(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Viewer phone",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						value: viewerPhone,
						onChange: (event) => setViewerPhone(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Viewer email",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						value: viewerEmail,
						onChange: (event) => setViewerEmail(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Negotiator",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: inputClass,
						value: negotiatorId,
						onChange: (event) => setNegotiatorId(Number(event.target.value)),
						children: staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: person.id,
							children: person.name
						}, person.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Notes",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "min-h-20 w-full rounded-xl border border-line p-3",
						value: notes,
						onChange: (event) => setNotes(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: immediate,
						onChange: (event) => setImmediate(event.target.checked)
					}), " Feedback was taken at the viewing"]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-bad",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: buttonClass,
					children: "Save viewing"
				})
			]
		})
	});
}
function FeedbackModal({ viewing, onClose, onSaved }) {
	const [interest, setInterest] = (0, import_react.useState)(viewing.interest || "interested");
	const [feedbackText, setFeedbackText] = (0, import_react.useState)(viewing.feedbackText);
	const [fields, setFields] = (0, import_react.useState)(viewing.feedback);
	const [error, setError] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		title: "Add feedback",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3",
			onSubmit: (event) => {
				event.preventDefault();
				saveFeedback({ data: {
					id: viewing.id,
					interest,
					feedbackText,
					fields
				} }).then(onSaved).catch((err) => setError(err instanceof Error ? err.message : "Could not save"));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [
						["very_interested", "Very interested"],
						["interested", "Interested"],
						["undecided", "Undecided"],
						["not_interested", "Not interested"]
					].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-11 rounded-xl border ${interest === id ? "border-pine bg-pine text-pine-ink" : "border-line"}`,
						onClick: () => setInterest(id),
						children: label
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Viewer feedback",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "min-h-36 w-full rounded-xl border border-line p-3",
						value: feedbackText,
						onChange: (event) => setFeedbackText(event.target.value),
						placeholder: "Paste what the viewer said"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer text-sm text-muted",
					children: "Room by room notes, if you want them"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid gap-3",
					children: NOTES.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: inputClass,
							value: fields[key] ?? "",
							onChange: (event) => setFields((current) => ({
								...current,
								[key]: event.target.value
							}))
						})
					}, key))
				})] }),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-bad",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: buttonClass,
					children: "Save feedback"
				})
			]
		})
	});
}
function MailModal({ viewing, meName, onClose, onSaved }) {
	const [agency, setAgency] = (0, import_react.useState)(viewing.agency === "gr" ? "gr" : "al");
	const [to, setTo] = (0, import_react.useState)([viewing.landlordEmail, viewing.landlordEmail2].filter(Boolean).join(", "));
	const [subject, setSubject] = (0, import_react.useState)(`Viewing feedback — ${viewing.address}`);
	const [body, setBody] = (0, import_react.useState)(emailDraft({
		landlord: viewing.landlordName,
		address: viewing.address,
		when: `${formatUk(viewing.viewedOn)} ${viewing.time}`.trim(),
		feedback: viewing.feedbackText,
		interest: statusLabel(viewing.interest),
		negotiator: viewing.negotiatorName || meName,
		agency
	}));
	const [message, setMessage] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		title: "Email landlord",
		onClose,
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3",
			onSubmit: (event) => {
				event.preventDefault();
				setBusy(true);
				sendFeedback({ data: {
					viewingId: viewing.id,
					agency,
					to,
					subject,
					body
				} }).then((result) => {
					setMessage(result.sent ? `Sent from ${result.from}` : result.error);
					if (result.sent) onSaved();
				}).catch((err) => setMessage(err instanceof Error ? err.message : "Could not send")).finally(() => setBusy(false));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"From ",
						agencyEmail(agency),
						" · ",
						agencyName(agency)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Sending agency",
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "To",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						value: to,
						onChange: (event) => setTo(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Subject",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						value: subject,
						onChange: (event) => setSubject(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Message",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "min-h-64 w-full rounded-xl border border-line p-3",
						value: body,
						onChange: (event) => setBody(event.target.value)
					})
				}),
				message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: message
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: buttonClass,
					disabled: busy,
					children: busy ? "Sending…" : "Send"
				})
			]
		})
	});
}
function LetForm({ staff, defaultStaff, onCancel, onSave }) {
	const [staffId, setStaffId] = (0, import_react.useState)(defaultStaff);
	const [on, setOn] = (0, import_react.useState)(todayIso());
	const [error, setError] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid gap-3",
		onSubmit: (event) => {
			event.preventDefault();
			onSave(staffId, on).catch((err) => setError(err instanceof Error ? err.message : "Could not save"));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Who agreed it",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: inputClass,
					value: staffId,
					onChange: (event) => setStaffId(Number(event.target.value)),
					children: staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: person.id,
						children: person.name
					}, person.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Date",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					type: "date",
					value: on,
					onChange: (event) => setOn(event.target.value)
				})
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-bad",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: buttonClass,
					children: "Mark let agreed"
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
export { PropertyPage as component };
