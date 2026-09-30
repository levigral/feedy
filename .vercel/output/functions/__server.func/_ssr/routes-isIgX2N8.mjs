import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as statusLabel, l as isFeedbackComplete, o as feedbackTone, s as formatUk, t as ageLabel } from "./labels-DDHELNR_.mjs";
import { E as markApplication, c as Progress, d as quietClass, f as useOffice, i as Empty, l as buttonClass, r as Badge, s as PageTitle, v as getBoard } from "./router-BjwAJETe.mjs";
import { t as StaffTable } from "./staff-table-DIY7-soI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-isIgX2N8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const { agency } = useOffice();
	const [range, setRange] = (0, import_react.useState)("all");
	const [negotiatorId, setNegotiatorId] = (0, import_react.useState)(0);
	const [board, setBoard] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)("");
	const [tick, setTick] = (0, import_react.useState)(0);
	const [note, setNote] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let live = true;
		getBoard({ data: {
			agency,
			range,
			negotiatorId
		} }).then((value) => {
			if (live) setBoard(value);
		}).catch((err) => {
			if (live) setError(err instanceof Error ? err.message : "Could not load the dashboard");
		});
		return () => {
			live = false;
		};
	}, [
		agency,
		range,
		negotiatorId,
		tick
	]);
	const waiting = (board?.matched ?? []).filter((row) => !isFeedbackComplete(row.status));
	const cards = board ? [
		{
			key: "properties",
			label: "Active properties",
			value: String(board.activeProperties)
		},
		{
			key: "viewings",
			label: "Viewings",
			value: String(board.viewings)
		},
		{
			key: "done",
			label: "Emailed",
			value: String(board.done)
		},
		{
			key: "outstanding",
			label: "Outstanding",
			value: String(board.outstanding)
		},
		{
			key: "completion",
			label: "Completion",
			value: `${board.percent}%`
		},
		{
			key: "interested",
			label: "Interested",
			value: String(board.interested)
		},
		{
			key: "applications",
			label: "Applications",
			value: String(board.applications)
		}
	] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			title: "Dashboard",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/properties",
					hash: "add",
					className: quietClass,
					children: "Add property"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/viewings",
					hash: "add",
					className: buttonClass,
					children: "Add viewing"
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: [[
				"all",
				"today",
				"week",
				"month"
			].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `h-11 rounded-full px-4 text-sm ${range === item ? "bg-pine text-pine-ink" : "bg-card border border-line"}`,
				onClick: () => setRange(item),
				children: item === "all" ? "All" : item === "today" ? "Today" : item === "week" ? "This week" : "This month"
			}, item)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "h-11 rounded-full border border-line bg-card px-3",
				value: negotiatorId,
				onChange: (event) => setNegotiatorId(Number(event.target.value)),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: 0,
					children: "Everyone"
				}), board?.staff.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: person.id,
					children: person.name
				}, person.id))]
			})]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-bad",
			children: error
		}) : null,
		note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-good",
			children: note
		}) : null,
		board?.attention ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/outstanding",
			className: "mb-4 flex items-center justify-between rounded-2xl bg-bad-bg px-4 py-3 text-bad",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [board.attention, " viewing feedbacks need attention"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open the list" })]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
			children: cards.map((card) => card.key === "properties" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/properties",
				className: "rounded-2xl border border-line bg-card p-4 hover:border-pine",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: card.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl",
						children: card.value
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-pine",
						children: "Open properties"
					})
				]
			}, card.key) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `rounded-2xl border p-4 text-left ${open === card.key ? "border-pine bg-card" : "border-line bg-card"}`,
				onClick: () => setOpen((current) => current === card.key ? "" : card.key),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: card.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl",
						children: card.value
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-pine",
						children: open === card.key ? "Hide" : "Open"
					})
				]
			}, card.key))
		}),
		open === "viewings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drill, {
			title: "Viewings",
			rows: board?.matched ?? []
		}) : null,
		open === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drill, {
			title: "Emailed to the landlord",
			rows: board?.doneQueue ?? [],
			showFeedback: true
		}) : null,
		open === "outstanding" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drill, {
			title: "Outstanding",
			rows: waiting
		}) : null,
		open === "interested" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drill, {
			title: "Interested, still to follow up",
			rows: board?.interestedQueue ?? [],
			showFeedback: true
		}) : null,
		open === "applications" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drill, {
			title: "Applications sent to the landlord",
			rows: board?.applicationQueue ?? [],
			showFeedback: true
		}) : null,
		open === "completion" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-3 rounded-2xl border border-line bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-medium",
					children: [board?.percent ?? 0, "% of viewings in this period have been emailed to the landlord."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drill, {
					title: "Still outstanding",
					rows: waiting,
					bare: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drill, {
					title: "Feedback already emailed",
					rows: board?.doneQueue ?? [],
					showFeedback: true,
					bare: true
				})
			]
		}) : null,
		board ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: board.percent })
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Outstanding feedback"
		}),
		!board ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-muted",
			children: "Loading…"
		}) : board.queue.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
				title: "Nothing waiting",
				body: "Drop a diary on Viewings. Each viewing stays here until feedback is in."
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid gap-2",
			children: board.queue.slice(0, 8).map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/properties/$propertyId",
				params: { propertyId: String(viewing.propertyId) },
				search: { feedback: viewing.id },
				className: "grid gap-1 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: viewing.address
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						viewing.negotiatorName || "Unassigned",
						" · ",
						formatUk(viewing.viewedOn),
						" ",
						viewing.time,
						" · ",
						viewing.viewerName || "Viewer not named"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: feedbackTone(viewing.status, viewing.days),
					children: [
						ageLabel(viewing.days, viewing.status),
						" · ",
						statusLabel(viewing.status)
					]
				})]
			}, viewing.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Interested viewers"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-2xl text-sm text-muted",
			children: "Anyone who said they are interested or very interested stays here until the negotiator sends an application to the landlord."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InterestList, {
			rows: board?.interestedQueue ?? [],
			empty: "Nobody waiting. They appear here after feedback is marked interested or very interested.",
			action: "Application sent to landlord",
			onAction: (id) => {
				markApplication({ data: {
					id,
					across: true
				} }).then(() => {
					setNote("Moved to applications sent to the landlord.");
					setTick((value) => value + 1);
				}).catch((err) => setError(err instanceof Error ? err.message : "Could not update"));
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Applications sent to the landlord"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-2xl text-sm text-muted",
			children: "These viewers are no longer pending. The application has gone across."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InterestList, {
			rows: board?.applicationQueue ?? [],
			empty: "No applications sent yet.",
			action: "Move back to interested",
			onAction: (id) => {
				markApplication({ data: {
					id,
					across: false
				} }).then(() => {
					setNote("Moved back to interested viewers.");
					setTick((value) => value + 1);
				}).catch((err) => setError(err instanceof Error ? err.message : "Could not update"));
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "Viewings per let"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffTable, { staff: board?.staff ?? [] })
	] });
}
function InterestList({ rows, empty, action, onAction }) {
	if (rows.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-3 text-sm text-muted",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 grid gap-2",
		children: rows.map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-medium",
					children: [
						viewing.viewerName || "Viewer not named",
						" · ",
						statusLabel(viewing.interest)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/properties/$propertyId",
					params: { propertyId: String(viewing.propertyId) },
					className: "text-pine",
					children: viewing.address
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						viewing.negotiatorName || "Unassigned",
						" · ",
						formatUk(viewing.viewedOn),
						" ",
						viewing.time
					]
				}),
				viewing.feedbackText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: viewing.feedbackText
				}) : null
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: quietClass,
				onClick: () => onAction(viewing.id),
				children: action
			})]
		}, viewing.id))
	});
}
function Drill({ title, rows, showFeedback, bare }) {
	const body = rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Nothing in this list."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-2",
		children: rows.map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/properties/$propertyId",
			params: { propertyId: String(viewing.propertyId) },
			search: showFeedback ? {} : { feedback: viewing.id },
			className: "rounded-2xl border border-line bg-paper p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: viewing.address
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						viewing.negotiatorName || "Unassigned",
						" · ",
						formatUk(viewing.viewedOn),
						" ",
						viewing.time,
						" · ",
						viewing.viewerName || "Viewer not named"
					]
				}),
				showFeedback && viewing.feedbackText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: viewing.feedbackText
				}) : null
			]
		}, viewing.id))
	});
	if (bare) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mb-2 font-medium",
			children: title
		}), body]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-3 rounded-2xl border border-line bg-card p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mb-3 font-display text-2xl",
			children: title
		}), body]
	});
}
//#endregion
export { Dashboard as component };
