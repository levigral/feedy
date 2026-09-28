//#region node_modules/.nitro/vite/services/ssr/assets/diary-jhhX-lig.js
var MONTHS = {
	jan: 1,
	january: 1,
	feb: 2,
	february: 2,
	mar: 3,
	march: 3,
	apr: 4,
	april: 4,
	may: 5,
	jun: 6,
	june: 6,
	jul: 7,
	july: 7,
	aug: 8,
	august: 8,
	sep: 9,
	sept: 9,
	september: 9,
	oct: 10,
	october: 10,
	nov: 11,
	november: 11,
	dec: 12,
	december: 12
};
var UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;
function iso(year, month, day) {
	if (month < 1 || month > 12 || day < 1 || day > 31) return "";
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function excelSerial(serial) {
	const whole = Math.floor(serial);
	if (whole < 2e4 || whole > 8e4) return "";
	return new Date(Date.UTC(1899, 11, 30) + whole * 864e5).toISOString().slice(0, 10);
}
/** UK day-first. Never falls back to today. */
function parseUkDate(raw) {
	const text = raw.trim().replace(/,/g, " ");
	if (!text || /^(date|time|event|staff)$/i.test(text)) return "";
	if (/^\d{5}(\.\d+)?$/.test(text)) return excelSerial(Number(text));
	let match = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
	if (match) return iso(Number(match[1]), Number(match[2]), Number(match[3]));
	match = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
	if (match) {
		let year = Number(match[3]);
		if (year < 100) year += year >= 70 ? 1900 : 2e3;
		return iso(year, Number(match[2]), Number(match[1]));
	}
	match = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(\d{4})\b/);
	if (match) {
		const month = MONTHS[match[2].toLowerCase()];
		if (month) return iso(Number(match[3]), month, Number(match[1]));
	}
	match = text.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
	if (match) {
		const month = MONTHS[match[1].toLowerCase()];
		if (month) return iso(Number(match[3]), month, Number(match[2]));
	}
	return "";
}
function parseTime(raw) {
	const text = raw.trim().toLowerCase();
	if (!text || text === "time") return "";
	let match = text.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/);
	if (match) {
		let hour = Number(match[1]);
		const minute = Number(match[2]);
		if (match[3] === "pm" && hour < 12) hour += 12;
		if (match[3] === "am" && hour === 12) hour = 0;
		if (hour <= 23 && minute <= 59) return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
	}
	match = text.match(/\b(\d{1,2})\s*(am|pm)\b/);
	if (match) {
		let hour = Number(match[1]);
		if (match[2] === "pm" && hour < 12) hour += 12;
		if (match[2] === "am" && hour === 12) hour = 0;
		if (hour <= 23) return `${String(hour).padStart(2, "0")}:00`;
	}
	return "";
}
function isViewingEvent(event) {
	return /\bviewings?\b/i.test(event);
}
function addressFromEvent(event) {
	const rest = (event.match(/\bviewings?\b(?:\s+at)?\s*[:\-–]?\s*(.*)$/i)?.[1] ?? "").trim();
	if (!rest) return "";
	if (/^(accompanied|second|2nd|first|1st|open|house|virtual|block|rebook|cancelled|canceled)$/i.test(rest)) return "";
	if (rest.length < 4) return "";
	return rest.replace(/^at\s+/i, "").trim();
}
function splitPostcode(address) {
	const match = address.match(UK_POSTCODE);
	if (!match) return {
		address: address.trim(),
		postcode: ""
	};
	return {
		postcode: match[1].toUpperCase().replace(/\s+/, " "),
		address: address.replace(UK_POSTCODE, " ").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").trim()
	};
}
function addressKey(raw) {
	const { address, postcode } = splitPostcode(raw);
	return `${address} ${postcode}`.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((token) => token && ![
		"viewing",
		"at",
		"the"
	].includes(token)).slice(0, 6).join("");
}
function cell(row, index) {
	if (index == null || index < 0) return "";
	return (row[index] ?? "").trim();
}
function headerMap(row) {
	const map = {};
	row.forEach((value, index) => {
		const text = value.trim();
		if (!text) return;
		if (map.staff == null && /staff|negotiator|consultant|employee|agent|accompanied/i.test(text)) map.staff = index;
		else if (map.date == null && /^date$|viewing date|appt date|appointment date/i.test(text)) map.date = index;
		else if (map.time == null && /^time$|start time|appt time/i.test(text)) map.time = index;
		else if (map.event == null && /^event$|appointment type|^type$|^subject$|^category$|^description$/i.test(text)) map.event = index;
		else if (map.address == null && /address|property|street/i.test(text) && !/email/i.test(text)) map.address = index;
		else if (map.viewer == null && /applicant|viewer|tenant|attendee/i.test(text)) map.viewer = index;
		else if (map.phone == null && /phone|mobile|tel/i.test(text)) map.phone = index;
		else if (map.email == null && /e-?mail/i.test(text)) map.email = index;
		else if (map.notes == null && /^notes$|comment/i.test(text)) map.notes = index;
	});
	if (map.date == null) return null;
	if (map.staff == null && /^name$/i.test(row[0] ?? "")) map.staff = 0;
	if (map.time == null && map.event == null && map.staff == null) return null;
	if (map.staff == null) map.staff = 0;
	return map;
}
function findColumns(matrix) {
	const limit = Math.min(matrix.length, 20);
	for (let index = 0; index < limit; index += 1) {
		const map = headerMap(matrix[index] ?? []);
		if (map) return {
			start: index + 1,
			map
		};
	}
	return null;
}
function looksLikeAddress(value) {
	if (UK_POSTCODE.test(value)) return true;
	return /\d/.test(value) && /[A-Za-z]/.test(value) && value.trim().length > 5;
}
function draftFromParts(parts) {
	const date = parseUkDate(parts.rawDate);
	const time = parseTime(parts.rawTime);
	const event = parts.event.trim();
	const viewing = isViewingEvent(event);
	let address = parts.address.trim();
	if (!address) address = addressFromEvent(event);
	const issues = [];
	if (!viewing) issues.push("Not a viewing");
	if (!parts.staffName.trim()) issues.push("Staff not named");
	if (!date) issues.push("Date not read");
	if (!address) issues.push("No property address");
	const keep = issues.length === 0;
	return {
		id: `${parts.staffName}|${date}|${time}|${address}|${parts.viewerName}`.toLowerCase(),
		staffName: parts.staffName.trim(),
		date,
		rawDate: parts.rawDate.trim(),
		time,
		rawTime: parts.rawTime.trim(),
		event: event || "Viewing",
		address,
		viewerName: parts.viewerName.trim(),
		viewerPhone: parts.viewerPhone.trim(),
		viewerEmail: parts.viewerEmail.trim(),
		notes: parts.notes.trim(),
		keep,
		issue: keep ? "" : issues[0] ?? ""
	};
}
function parseDiaryMatrix(matrix) {
	const found = findColumns(matrix);
	const map = found?.map ?? {
		staff: 0,
		date: 1,
		time: 2,
		event: 3,
		address: 4
	};
	const start = found?.start ?? 0;
	const drafts = [];
	for (let index = start; index < matrix.length; index += 1) {
		const row = (matrix[index] ?? []).map((value) => value.trim());
		if (row.every((value) => !value)) continue;
		const staffName = cell(row, map.staff);
		const rawDate = cell(row, map.date);
		const rawTime = cell(row, map.time);
		let event = cell(row, map.event);
		if (!event) event = row.find((value) => isViewingEvent(value)) ?? "";
		if (/^(staff|negotiator|date|time|event)$/i.test(staffName) && /^date$/i.test(rawDate)) continue;
		let address = cell(row, map.address);
		if (!address) {
			const used = new Set([
				map.staff,
				map.date,
				map.time,
				map.event,
				map.viewer,
				map.phone,
				map.email,
				map.notes
			].filter((value) => value != null));
			address = row.find((value, cellIndex) => !used.has(cellIndex) && looksLikeAddress(value) && !isViewingEvent(value)) ?? "";
		}
		if (!staffName && !rawDate && !event && !address) continue;
		if (!event && !isViewingEvent(address)) continue;
		drafts.push(draftFromParts({
			staffName,
			rawDate,
			rawTime,
			event: event || (isViewingEvent(address) ? address : ""),
			address: isViewingEvent(address) && addressFromEvent(address) ? addressFromEvent(address) : address,
			viewerName: cell(row, map.viewer),
			viewerPhone: cell(row, map.phone),
			viewerEmail: cell(row, map.email),
			notes: cell(row, map.notes)
		}));
	}
	return drafts;
}
function matrixFromText(text) {
	const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
	const delimiter = lines.some((line) => line.includes("	")) ? "	" : ",";
	return lines.map((line) => splitDelimited(line, delimiter));
}
function splitDelimited(line, delimiter) {
	if (delimiter === "	") return line.split("	").map((part) => part.trim());
	const cells = [];
	let current = "";
	let quoted = false;
	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		if (char === "\"") {
			if (quoted && line[index + 1] === "\"") {
				current += "\"";
				index += 1;
			} else quoted = !quoted;
		} else if (char === delimiter && !quoted) {
			cells.push(current.trim());
			current = "";
		} else current += char;
	}
	cells.push(current.trim());
	return cells;
}
function clusterLines(items) {
	const sorted = [...items].sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
	const lines = [];
	for (const item of sorted) {
		const line = lines.find((entry) => entry[0] && entry[0].page === item.page && Math.abs(entry[0].y - item.y) <= 3);
		if (line) line.push(item);
		else lines.push([item]);
	}
	for (const line of lines) line.sort((a, b) => a.x - b.x);
	return lines;
}
function lineText(line) {
	return line.map((item) => item.str).join(" ");
}
function isHeaderLine(line) {
	const text = lineText(line);
	return /date/i.test(text) && /time|event|staff|negotiator/i.test(text);
}
function boundsFrom(line) {
	const starts = line.map((item) => item.x).sort((a, b) => a - b);
	const bounds = [starts[0] - 4];
	for (let index = 1; index < starts.length; index += 1) bounds.push((starts[index - 1] + starts[index]) / 2);
	bounds.push(1e5);
	return bounds;
}
function cellsFromLine(line, bounds) {
	if (!bounds) {
		const groups = [];
		let current = "";
		let lastX = -1e3;
		for (const item of line) {
			if (current && item.x - lastX > 28) {
				groups.push(current.trim());
				current = item.str;
			} else current = `${current} ${item.str}`.trim();
			lastX = item.x + Math.max(8, item.str.length * 4);
		}
		if (current.trim()) groups.push(current.trim());
		return groups;
	}
	const cells = Array.from({ length: bounds.length - 1 }, () => "");
	for (const item of line) {
		let column = bounds.findIndex((start, index) => item.x >= start && item.x < (bounds[index + 1] ?? 1e5));
		if (column < 0) column = cells.length - 1;
		cells[column] = `${cells[column]} ${item.str}`.trim();
	}
	return cells;
}
function matrixFromPositionedText(items) {
	const lines = clusterLines(items.filter((item) => item.str.trim()));
	let bounds = null;
	const matrix = [];
	for (const line of lines) {
		if (isHeaderLine(line)) bounds = boundsFrom(line);
		matrix.push(cellsFromLine(line, bounds));
	}
	return matrix;
}
function agencyFromFilename(name) {
	const text = name.toLowerCase();
	if (/gibbins|richards/.test(text)) return "gr";
	if (/andrew|lees|bridgwater/.test(text)) return "al";
	return "";
}
//#endregion
export { matrixFromText as a, matrixFromPositionedText as i, agencyFromFilename as n, parseDiaryMatrix as o, isViewingEvent as r, splitPostcode as s, addressKey as t };
