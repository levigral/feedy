import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as statusLabel, f as todayIso, o as feedbackTone, s as formatUk, t as ageLabel } from "./labels-DDHELNR_.mjs";
import { C as listProperties, N as saveProperty, S as importDiary, T as listViewings, a as Field, d as quietClass, f as useOffice, g as deleteViewing, l as buttonClass, m as addViewing, o as Modal, r as Badge, s as PageTitle, u as inputClass, w as listStaff } from "./router-BjwAJETe.mjs";
import { a as matrixFromPositionedText, c as prepareDiaryImport, n as agencyFromFilename, o as matrixFromText, r as diaryColumnWarnings, s as parseDiaryMatrix } from "./diary-CEGBpdpO.mjs";
import { t as UkDateInput } from "./uk-date-CKhc9vku.mjs";
import { n as emptyProperty } from "./property-form-DWGFes6D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/viewings-Du82-kCJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function matrixFromFile(file) {
	const name = file.name.toLowerCase();
	if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) return matrixFromText(await file.text());
	if (name.endsWith(".xlsx") || name.endsWith(".xls")) return matrixFromWorkbook(await file.arrayBuffer());
	if (name.endsWith(".pdf")) return matrixFromPdf(await file.arrayBuffer());
	throw new Error("Use a PDF, Excel or CSV diary.");
}
async function matrixFromWorkbook(buffer) {
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = XLSX.read(buffer, {
		type: "array",
		cellDates: false
	});
	const sheet = book.Sheets[book.SheetNames[0] ?? ""];
	if (!sheet || !sheet["!ref"]) return [];
	const range = XLSX.utils.decode_range(sheet["!ref"]);
	const matrix = [];
	for (let row = range.s.r; row <= range.e.r; row += 1) {
		const cells = [];
		for (let column = range.s.c; column <= range.e.c; column += 1) {
			const cell = sheet[XLSX.utils.encode_cell({
				r: row,
				c: column
			})];
			cells.push(cellText(cell));
		}
		matrix.push(cells);
	}
	return matrix;
}
function cellText(cell) {
	if (!cell) return "";
	if (cell.t === "n" && typeof cell.v === "number" && isDateFormat(cell.z)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(cell.v) * 864e5).toISOString().slice(0, 10);
	if (typeof cell.w === "string" && cell.w.trim()) return cell.w.trim();
	if (cell.v == null) return "";
	return String(cell.v).trim();
}
function isDateFormat(format) {
	if (!format) return false;
	const text = format.toLowerCase();
	return /[dmy]/.test(text) && !text.includes("#");
}
async function matrixFromPdf(buffer) {
	const pdfjs = await import("../_libs/pdfjs-dist.mjs").then((n) => n.t);
	if (!pdfjs.GlobalWorkerOptions.workerSrc) {
		const worker = await import("./pdf.worker.min-CA4SejP6.mjs");
		pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	}
	const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
	const items = [];
	for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
		const content = await (await doc.getPage(pageNumber)).getTextContent();
		for (const item of content.items) {
			const str = "str" in item ? item.str : "";
			const transform = "transform" in item ? item.transform : void 0;
			if (!str?.trim() || !transform) continue;
			items.push({
				str,
				x: transform[4] ?? 0,
				y: transform[5] ?? 0,
				page: pageNumber
			});
		}
	}
	return matrixFromPositionedText(items);
}
function isSpreadsheet(name) {
	const lower = name.toLowerCase();
	return lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt") || lower.endsWith(".xlsx") || lower.endsWith(".xls");
}
function checkedRows(name, rows) {
	return prepareDiaryImport(rows, { requireViewer: isSpreadsheet(name) }).map((row) => ({
		...row,
		keep: row.issues.length === 0
	}));
}
function checkNote(rows) {
	const ready = rows.filter((row) => row.issues.length === 0).length;
	const blocked = rows.length - ready;
	if (!rows.length) return "";
	if (!blocked) return `Checked ${rows.length} viewing${rows.length === 1 ? "" : "s"}. All rows are valid. Nothing is saved until you press Import.`;
	return `Checked ${rows.length} viewing${rows.length === 1 ? "" : "s"}. ${ready} ready. ${blocked} need fixing and will not be imported.`;
}
function diaryRow(row, agency) {
	return {
		staffName: row.staffName,
		date: row.date,
		time: row.time,
		address: row.address,
		viewerName: row.viewerName,
		viewerPhone: row.viewerPhone,
		viewerEmail: row.viewerEmail,
		notes: row.notes,
		agency,
		event: row.event || "Viewing",
		landlordName: row.landlordName,
		landlordEmail: row.landlordEmail,
		landlordName2: row.landlordName2,
		landlordEmail2: row.landlordEmail2
	};
}
function ViewingsPage() {
	const { agency, me } = useOffice();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [result, setResult] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	const [letAgreed, setLetAgreed] = (0, import_react.useState)([]);
	function rememberMatches(found) {
		if (!found.length) return;
		setLetAgreed((current) => {
			const next = current.map((item) => ({
				...item,
				rows: [...item.rows]
			}));
			for (const item of found) {
				const existing = next.find((entry) => entry.propertyId === item.propertyId);
				if (existing) existing.rows.push(...item.rows);
				else next.push(item);
			}
			return next;
		});
	}
	function summaryText(summary, fileName) {
		const names = summary.createdStaff.length ? ` New staff: ${summary.createdStaff.join(", ")}.` : "";
		const viewers = summary.namedViewings ? ` Viewer names added to ${summary.namedViewings} viewing${summary.namedViewings === 1 ? "" : "s"}.` : "";
		const ask = summary.letAgreed.length ? ` ${summary.letAgreed.length} already let agreed — choose whether to keep the old landlord details.` : "";
		return `${fileName ? `${fileName}: ` : ""}${summary.createdViewings} viewings added, ${summary.createdProperties} new properties. Addresses already on the system were not added again.${names}${viewers}${ask}`;
	}
	function load() {
		listViewings({ data: {} }).then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Could not load viewings"));
	}
	(0, import_react.useEffect)(load, []);
	(0, import_react.useEffect)(() => {
		if (window.location.hash === "#add") setAdding(true);
	}, []);
	async function onFiles(list) {
		if (!list?.length) return;
		setResult("");
		const next = [];
		for (const file of Array.from(list)) try {
			const matrix = await matrixFromFile(file);
			const warnings = isSpreadsheet(file.name) ? diaryColumnWarnings(matrix) : [];
			const reviewed = checkedRows(file.name, parseDiaryMatrix(matrix));
			const fileAgency = agencyFromFilename(file.name) || (agency === "gr" || agency === "al" ? agency : "");
			if (!reviewed.length) {
				next.push({
					name: file.name,
					agency: fileAgency,
					rows: [],
					note: "",
					error: [warnings.join(" "), "No viewing appointments were found. Only lines with the word viewing are used."].filter(Boolean).join(" ")
				});
				continue;
			}
			next.push({
				name: file.name,
				agency: fileAgency,
				rows: reviewed,
				note: checkNote(reviewed),
				error: warnings.join(" ")
			});
		} catch (err) {
			next.push({
				name: file.name,
				agency: "",
				rows: [],
				note: "",
				error: err instanceof Error ? err.message : "Could not read that diary"
			});
		}
		setFiles((current) => [...next, ...current]);
	}
	function update(fileIndex, rowIndex, patch) {
		setFiles((current) => current.map((file, index) => {
			if (index !== fileIndex) return file;
			const edited = file.rows.map((row, inner) => inner === rowIndex ? {
				...row,
				...patch
			} : row);
			const rows = prepareDiaryImport(edited, { requireViewer: isSpreadsheet(file.name) }).map((row, inner) => {
				const previous = edited[inner];
				const chosen = patch.keep !== void 0 && inner === rowIndex ? patch.keep : previous?.keep;
				const becameValid = (previous?.issues.length ?? 0) > 0 && row.issues.length === 0;
				return {
					...row,
					keep: row.issues.length === 0 ? becameValid ? true : Boolean(chosen) : false
				};
			});
			return {
				...file,
				rows,
				note: checkNote(rows)
			};
		}));
	}
	async function confirm() {
		const chosen = files.flatMap((file) => file.rows.filter((row) => row.keep && row.issues.length === 0).map((row) => ({
			...row,
			agency: file.agency
		})));
		if (!chosen.length) {
			setError("Nothing is ready to import. Fix the rows marked in red, and choose an agency.");
			return;
		}
		if (chosen.some((row) => row.agency !== "al" && row.agency !== "gr")) {
			setError("Choose Andrew Lees or Gibbins Richards for each diary.");
			return;
		}
		if (chosen.some((row) => row.issues.length > 0)) {
			setError("Fix the rows marked in red before importing.");
			return;
		}
		setBusy(true);
		setError("");
		try {
			const summary = await importDiary({ data: { rows: chosen.map((row) => diaryRow(row, row.agency)) } });
			rememberMatches(summary.letAgreed);
			setResult(summaryText(summary));
			setFiles((current) => current.map((file) => {
				const rows = file.rows.filter((row) => row.issues.length > 0);
				return {
					...file,
					rows,
					note: checkNote(rows)
				};
			}).filter((file) => file.rows.length > 0));
			load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Import failed");
		} finally {
			setBusy(false);
		}
	}
	async function decideLetAgreed(match, reuse) {
		setBusy(true);
		setError("");
		try {
			const summary = await importDiary({ data: { rows: match.rows.map((row, index) => ({
				...row,
				reuseId: reuse ? match.propertyId : void 0,
				forceNew: reuse || index > 0 ? void 0 : true
			})) } });
			setLetAgreed((current) => current.filter((item) => item.propertyId !== match.propertyId));
			rememberMatches(summary.letAgreed);
			setResult(reuse ? `${match.address} is back on the market with the previous landlord details. ${summary.createdViewings} viewings added.` : `${match.address} was added as a new property so you can enter the new landlord. ${summary.createdViewings} viewings added.`);
			load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save that choice");
		} finally {
			setBusy(false);
		}
	}
	const visible = rows.filter((row) => agency === "all" || row.agency === agency);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			title: "Viewings",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: buttonClass,
				onClick: () => setAdding(true),
				children: "Add viewing"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-2xl border border-line bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Import a diary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-2xl text-sm text-muted",
					children: "Drop a CSV diary. Feedy checks staff, date, time, property, Viewer Name and any email addresses before anything is saved. Appointments that say viewing are kept. Fix any row marked in red, then press Import."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-line bg-paper text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "px-4 py-6 text-sm",
						children: "Drop PDF, Excel or CSV diaries here, or click to choose"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "sr-only",
						type: "file",
						accept: ".pdf,.csv,.tsv,.txt,.xlsx,.xls",
						multiple: true,
						onChange: (event) => {
							onFiles(event.target.files);
							event.target.value = "";
						}
					})]
				}),
				files.map((file, fileIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: file.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: inputClass + " max-w-xs",
								value: file.agency,
								onChange: (event) => setFiles((current) => current.map((item, index) => index === fileIndex ? {
									...item,
									agency: event.target.value
								} : item)),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Choose agency"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "al",
										children: "Andrew Lees Lettings"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "gr",
										children: "Gibbins Richards Lettings"
									})
								]
							})]
						}),
						file.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm",
							children: file.note
						}) : null,
						file.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-bad",
							children: file.error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full min-w-[46rem] text-left text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "text-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-2",
											children: "Use"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-2",
											children: "Staff"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-2",
											children: "Date"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-2",
											children: "Time"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-2",
											children: "Event"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-2",
											children: "Viewer"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2",
											children: "Property"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: file.rows.map((row, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: `border-t border-line align-top ${row.issues.length ? "bg-bad-bg" : ""}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 pr-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												className: "mt-3 size-5",
												checked: row.keep,
												disabled: row.issues.length > 0,
												onChange: (event) => update(fileIndex, rowIndex, { keep: event.target.checked })
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 pr-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: inputClass,
												value: row.staffName,
												onChange: (event) => update(fileIndex, rowIndex, { staffName: event.target.value })
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "py-2 pr-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UkDateInput, {
													value: row.date,
													onChange: (date) => update(fileIndex, rowIndex, { date })
												}),
												!row.date && row.rawDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-xs text-bad",
													children: ["Diary said ", row.rawDate]
												}) : null,
												!row.date ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-xs text-bad",
													children: "Date not read"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-xs text-muted",
													children: formatUk(row.date)
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 pr-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: inputClass,
												value: row.time,
												onChange: (event) => update(fileIndex, rowIndex, { time: event.target.value })
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "py-2 pr-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: row.event || "—" }), row.issue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-bad",
												children: row.issue
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 pr-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: inputClass,
												value: row.viewerName,
												placeholder: "Viewer name",
												onChange: (event) => update(fileIndex, rowIndex, { viewerName: event.target.value })
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: inputClass,
												value: row.address,
												placeholder: "Property address",
												onChange: (event) => update(fileIndex, rowIndex, { address: event.target.value })
											})
										})
									]
								}, `${row.id}-${rowIndex}`)) })]
							})
						})
					]
				}, `${file.name}-${fileIndex}`)),
				files.some((file) => file.rows.some((row) => row.keep && row.issues.length === 0)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `${buttonClass} mt-4`,
					disabled: busy,
					onClick: () => void confirm(),
					children: busy ? "Saving…" : "Import ready viewings"
				}) : null,
				result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-good",
					children: result
				}) : null,
				letAgreed.map((match) => {
					const previous = [
						match.landlordName,
						match.landlordEmail,
						match.landlordName2,
						match.landlordEmail2
					].filter((item) => item && item !== "To be added");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "mt-4 rounded-2xl border border-line bg-paper p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-medium",
								children: [match.address, " is already let agreed"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted",
								children: [
									match.rows.length,
									" viewing",
									match.rows.length === 1 ? "" : "s",
									" in this diary.",
									previous.length ? ` Previous landlord: ${previous.join(" · ")}.` : " No landlord details were saved last time."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: buttonClass,
									disabled: busy,
									onClick: () => void decideLetAgreed(match, true),
									children: "Use previous landlord details"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: quietClass,
									disabled: busy,
									onClick: () => void decideLetAgreed(match, false),
									children: "New property, new landlord"
								})]
							})
						]
					}, match.propertyId);
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-bad",
					children: error
				}) : null
			]
		}),
		adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManualViewing, {
			agency: agency === "gr" ? "gr" : "al",
			defaultStaff: me?.id ?? 0,
			onClose: () => setAdding(false),
			onSaved: () => {
				setAdding(false);
				load();
			}
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 font-display text-2xl",
			children: "On the book"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid gap-2",
			children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No viewings yet."
			}) : visible.map((viewing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl border border-line bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-2",
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
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: feedbackTone(viewing.status, viewing.days),
						children: ageLabel(viewing.days, viewing.status)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/properties/$propertyId",
							params: { propertyId: String(viewing.propertyId) },
							className: quietClass,
							children: "View property"
						}),
						me?.role === "admin" ? confirmId === viewing.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quietClass,
							onClick: () => {
								setRows((current) => current.filter((row) => row.id !== viewing.id));
								setConfirmId(null);
								deleteViewing({ data: { id: viewing.id } }).then(() => load()).catch((err) => {
									setError(err instanceof Error ? err.message : "Could not delete that viewing");
									load();
								});
							},
							children: "Confirm delete"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quietClass,
							onClick: () => setConfirmId(viewing.id),
							children: "Delete"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "self-center text-sm text-muted",
							children: statusLabel(viewing.status)
						})
					]
				})]
			}, viewing.id))
		})
	] });
}
function ManualViewing({ agency, defaultStaff, onClose, onSaved }) {
	const [properties, setProperties] = (0, import_react.useState)([]);
	const [staff, setStaff] = (0, import_react.useState)([]);
	const [filter, setFilter] = (0, import_react.useState)("");
	const [propertyId, setPropertyId] = (0, import_react.useState)(0);
	const [address, setAddress] = (0, import_react.useState)("");
	const [postcode, setPostcode] = (0, import_react.useState)("");
	const [propertyAgency, setPropertyAgency] = (0, import_react.useState)(agency);
	const [date, setDate] = (0, import_react.useState)(todayIso());
	const [time, setTime] = (0, import_react.useState)("");
	const [viewerName, setViewerName] = (0, import_react.useState)("");
	const [viewerPhone, setViewerPhone] = (0, import_react.useState)("");
	const [viewerEmail, setViewerEmail] = (0, import_react.useState)("");
	const [negotiatorId, setNegotiatorId] = (0, import_react.useState)(defaultStaff);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		listProperties().then(setProperties).catch(() => setProperties([]));
		listStaff().then((people) => {
			setStaff(people);
			if (!defaultStaff && people[0]) setNegotiatorId(people[0].id);
		}).catch(() => setStaff([]));
	}, [defaultStaff]);
	const choices = properties.filter((row) => {
		return `${row.address} ${row.postcode}`.toLowerCase().includes(filter.toLowerCase());
	});
	async function save() {
		setBusy(true);
		setError("");
		try {
			let id = propertyId;
			if (!id) {
				const line = address.trim();
				if (!line) throw new Error("Choose a property, or type the address of a new one.");
				id = (await saveProperty({ data: {
					...emptyProperty,
					address: line,
					postcode,
					agency: propertyAgency
				} })).id;
			}
			await addViewing({ data: {
				propertyId: id,
				date,
				time,
				viewerName,
				viewerPhone,
				viewerEmail,
				negotiatorId,
				notes,
				immediate: false
			} });
			onSaved();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		title: "Add viewing",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3",
			onSubmit: (event) => {
				event.preventDefault();
				save();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Find a property",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						value: filter,
						placeholder: "Search address",
						onChange: (event) => setFilter(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Property",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: inputClass,
						value: propertyId,
						onChange: (event) => setPropertyId(Number(event.target.value)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 0,
							children: "New property — type the address below"
						}), choices.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: row.id,
							children: [row.address, row.postcode ? `, ${row.postcode}` : ""]
						}, row.id))]
					})
				}),
				propertyId === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "New address",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: inputClass,
							value: address,
							onChange: (event) => setAddress(event.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Postcode",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: inputClass,
							value: postcode,
							onChange: (event) => setPostcode(event.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Agency",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: inputClass,
							value: propertyAgency,
							onChange: (event) => setPropertyAgency(event.target.value === "gr" ? "gr" : "al"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "al",
								children: "Andrew Lees Lettings"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "gr",
								children: "Gibbins Richards Lettings"
							})]
						})
					})
				] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UkDateInput, {
						value: date,
						onChange: setDate,
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
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: inputClass,
						value: negotiatorId,
						onChange: (event) => setNegotiatorId(Number(event.target.value)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: 0,
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
						className: "min-h-20 w-full rounded-xl border border-line p-3",
						value: notes,
						onChange: (event) => setNotes(event.target.value)
					})
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-bad",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: buttonClass,
					disabled: busy,
					children: busy ? "Saving…" : "Save viewing"
				})
			]
		})
	});
}
//#endregion
export { ViewingsPage as component };
