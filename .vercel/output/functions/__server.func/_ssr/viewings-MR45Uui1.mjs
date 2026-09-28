import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as feedbackTone, c as statusLabel, o as formatUk, t as ageLabel } from "./labels-DbTtzT8f.mjs";
import { d as quietClass, f as useOffice, l as buttonClass, r as Badge, s as PageTitle, u as inputClass, w as listViewings, x as importDiary } from "./router-CHnq8sEm.mjs";
import { a as matrixFromText, i as matrixFromPositionedText, n as agencyFromFilename, o as parseDiaryMatrix } from "./diary-jhhX-lig.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/viewings-MR45Uui1.js
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
function ViewingsPage() {
	const { agency } = useOffice();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [result, setResult] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	function load() {
		listViewings().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Could not load viewings"));
	}
	(0, import_react.useEffect)(load, []);
	async function onFiles(list) {
		if (!list?.length) return;
		setResult("");
		const next = [];
		for (const file of Array.from(list)) try {
			const matrix = await matrixFromFile(file);
			const parsed = parseDiaryMatrix(matrix);
			next.push({
				name: file.name,
				agency: agencyFromFilename(file.name) || (agency === "gr" ? "gr" : agency === "al" ? "al" : ""),
				rows: parsed,
				error: parsed.length ? "" : "No rows were read. Check the file has staff, date, time and event columns."
			});
		} catch (err) {
			next.push({
				name: file.name,
				agency: "",
				rows: [],
				error: err instanceof Error ? err.message : "Could not read that diary"
			});
		}
		setFiles((current) => [...next, ...current]);
	}
	function update(fileIndex, rowIndex, patch) {
		setFiles((current) => current.map((file, index) => index === fileIndex ? {
			...file,
			rows: file.rows.map((row, inner) => inner === rowIndex ? {
				...row,
				...patch
			} : row)
		} : file));
	}
	async function confirm() {
		const chosen = files.flatMap((file) => file.rows.filter((row) => row.keep).map((row) => ({
			...row,
			agency: file.agency
		})));
		if (!chosen.length) {
			setError("Tick the viewing rows you want, and choose an agency for each file.");
			return;
		}
		if (chosen.some((row) => row.agency !== "al" && row.agency !== "gr")) {
			setError("Choose Andrew Lees or Gibbins Richards for each diary.");
			return;
		}
		if (chosen.some((row) => !row.date || !row.staffName || !row.address)) {
			setError("Each ticked row needs a staff name, a date and a property address.");
			return;
		}
		setBusy(true);
		setError("");
		try {
			const summary = await importDiary({ data: { rows: chosen.map((row) => ({
				staffName: row.staffName,
				date: row.date,
				time: row.time,
				address: row.address,
				viewerName: row.viewerName,
				viewerPhone: row.viewerPhone,
				viewerEmail: row.viewerEmail,
				notes: row.notes,
				agency: row.agency,
				event: row.event || "Viewing"
			})) } });
			const names = summary.createdStaff.length ? ` Added to staff: ${summary.createdStaff.join(", ")}.` : "";
			setResult(`Imported ${summary.createdViewings} viewings and ${summary.createdProperties} new properties. ${summary.skipped} already on the book or skipped.${names}`);
			setFiles([]);
			load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Import failed");
		} finally {
			setBusy(false);
		}
	}
	const visible = rows.filter((row) => agency === "all" || row.agency === agency);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, { title: "Viewings" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-2xl border border-line bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Import a diary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-2xl text-sm text-muted",
					children: "Drop one or more days. The first column is the negotiator, then the date the viewing happened, then the time, then the event. Only rows titled Viewing are kept. The date in the diary is used, including last week. If the negotiator is not on the staff list, they are added and the viewings are linked to them."
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
											className: "py-2",
											children: "Property"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: file.rows.map((row, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-line align-top",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 pr-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												className: "mt-3 size-5",
												checked: row.keep,
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
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													className: inputClass,
													type: "date",
													value: row.date,
													onChange: (event) => update(fileIndex, rowIndex, { date: event.target.value })
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
				files.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `${buttonClass} mt-4`,
					disabled: busy,
					onClick: () => void confirm(),
					children: busy ? "Importing…" : "Add these viewings"
				}) : null,
				result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-good",
					children: result
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-bad",
					children: error
				}) : null
			]
		}),
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
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/properties/$propertyId",
						params: { propertyId: String(viewing.propertyId) },
						className: quietClass,
						children: "View property"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "self-center text-sm text-muted",
						children: statusLabel(viewing.status)
					})]
				})]
			}, viewing.id))
		})
	] });
}
//#endregion
export { ViewingsPage as component };
