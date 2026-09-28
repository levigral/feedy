export type PosItem = { str: string; x: number; y: number; page: number };

export type DraftViewing = {
  id: string;
  staffName: string;
  date: string;
  rawDate: string;
  time: string;
  rawTime: string;
  event: string;
  address: string;
  viewerName: string;
  viewerPhone: string;
  viewerEmail: string;
  landlordName: string;
  landlordEmail: string;
  landlordName2: string;
  landlordEmail2: string;
  notes: string;
  keep: boolean;
  issue: string;
};

const MONTHS: Record<string, number> = {
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
  december: 12,
};

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;

function iso(year: number, month: number, day: number): string {
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function excelSerial(serial: number): string {
  const whole = Math.floor(serial);
  if (whole < 20000 || whole > 80000) return "";
  const date = new Date(Date.UTC(1899, 11, 30) + whole * 86400000);
  return date.toISOString().slice(0, 10);
}

/** UK day-first. Never falls back to today. */
export function parseUkDate(raw: string): string {
  const text = raw.trim().replace(/,/g, " ");
  if (!text || /^(date|time|event|staff)$/i.test(text)) return "";
  if (/^\d{5}(\.\d+)?$/.test(text)) return excelSerial(Number(text));
  let match = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (match) return iso(Number(match[1]), Number(match[2]), Number(match[3]));
  match = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
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

export function parseTime(raw: string): string {
  const text = raw.trim().toLowerCase();
  if (!text || text === "time") return "";
  let match = text.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (match[3] === "pm" && hour < 12) hour += 12;
    if (match[3] === "am" && hour === 12) hour = 0;
    if (hour <= 23 && minute <= 59) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
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

export function isViewingEvent(event: string): boolean {
  return /\bviewings?\b/i.test(event);
}

function addressFromEvent(event: string): string {
  const match = event.match(/\bviewings?\b(?:\s+at)?\s*[:\-–]?\s*(.*)$/i);
  const rest = (match?.[1] ?? "").trim();
  if (!rest) return "";
  if (/^(accompanied|second|2nd|first|1st|open|house|virtual|block|rebook|cancelled|canceled)$/i.test(rest)) {
    return "";
  }
  if (rest.length < 4) return "";
  return rest.replace(/^at\s+/i, "").trim();
}

export function splitPostcode(address: string): { address: string; postcode: string } {
  const match = address.match(UK_POSTCODE);
  if (!match) return { address: address.trim(), postcode: "" };
  return {
    postcode: match[1].toUpperCase().replace(/\s+/, " "),
    address: address.replace(UK_POSTCODE, " ").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").trim(),
  };
}

export function addressKey(raw: string): string {
  const { address, postcode } = splitPostcode(raw);
  const tokens = `${address} ${postcode}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !["viewing", "at", "the"].includes(token));
  return tokens.slice(0, 6).join("");
}

function cell(row: string[], index: number | undefined): string {
  if (index == null || index < 0) return "";
  return (row[index] ?? "").trim();
}

type ColumnMap = {
  staff?: number;
  date?: number;
  time?: number;
  event?: number;
  address?: number;
  viewer?: number;
  phone?: number;
  email?: number;
  landlordName?: number;
  landlordEmail?: number;
  landlordName2?: number;
  landlordEmail2?: number;
  notes?: number;
};

function landlordSlot(header: string): 0 | 1 | 2 {
  const text = header.toLowerCase().replace(/[_-]+/g, " ");
  if (!text.includes("landlord")) return 0;
  if (/landlord\s*2|second landlord|additional landlord|landlord two/.test(text)) return 2;
  return 1;
}

function headerMap(row: string[]): ColumnMap | null {
  const map: ColumnMap = {};
  row.forEach((value, index) => {
    const text = value.trim().replace(/_/g, " ");
    if (!text) return;
    const slot = landlordSlot(text);
    if (slot) {
      const email = /e-?mail/i.test(text);
      const postal = /\baddress\b/i.test(text) && !email;
      const phone = /phone|mobile|tel/i.test(text);
      if (email) {
        if (slot === 2) {
          if (map.landlordEmail2 == null) map.landlordEmail2 = index;
        } else if (map.landlordEmail == null) map.landlordEmail = index;
      } else if (!postal && !phone) {
        if (slot === 2) {
          if (map.landlordName2 == null) map.landlordName2 = index;
        } else if (map.landlordName == null) map.landlordName = index;
      }
      return;
    }
    if (map.staff == null && /staff|negotiator|consultant|employee|agent|accompanied/i.test(text)) map.staff = index;
    else if (map.date == null && /\bdate\b/i.test(text)) map.date = index;
    else if (map.time == null && /\btime\b/i.test(text)) map.time = index;
    else if (map.event == null && /event|appointment|^type$|^subject$|^category$|^description$/i.test(text)) {
      map.event = index;
    } else if (map.address == null && /address|property|street/i.test(text) && !/email/i.test(text)) {
      map.address = index;
    } else if (map.viewer == null && /applicant|viewer|tenant|attendee/i.test(text)) map.viewer = index;
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

function findColumns(matrix: string[][]): { start: number; map: ColumnMap } | null {
  const limit = Math.min(matrix.length, 20);
  for (let index = 0; index < limit; index += 1) {
    const map = headerMap(matrix[index] ?? []);
    if (map) return { start: index + 1, map };
  }
  return null;
}

const NOT_A_NAME =
  /\b(diary|agenda|office|appointment|viewing|valuation|meeting|morning|afternoon|page|printed|confidential|lettings|street|road|close|avenue|lane|drive|court|gardens|terrace|place|way|crescent|bridgwater|burnham|taunton|high|queen|king)\b/i;

function isPersonName(value: string): boolean {
  const text = value.trim();
  if (!text || text.length > 48 || /\d/.test(text) || NOT_A_NAME.test(text)) return false;
  const parts = text.split(/\s+/);
  if (parts.length < 2 || parts.length > 4) return false;
  return parts.every((part) => /^[A-Z][A-Za-z'’.-]+$/.test(part));
}

function isHeaderish(line: string): boolean {
  const words = line
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z]/g, ""))
    .filter(Boolean);
  if (!words.length) return false;
  const labels = new Set([
    "staff",
    "negotiator",
    "consultant",
    "name",
    "date",
    "time",
    "event",
    "type",
    "appointment",
    "appointments",
    "property",
    "address",
    "applicant",
    "viewer",
    "notes",
    "diary",
    "agenda",
    "viewing",
    "details",
    "description",
    "subject",
  ]);
  return words.every((word) => labels.has(word));
}

function sectionDateOf(line: string): string {
  if (isViewingEvent(line) || /\d{1,2}[:.]\d{2}/.test(line)) return "";
  const date = parseUkDate(line);
  if (!date) return "";
  const rest = line
    .replace(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi, "")
    .replace(/\b\d{1,2}(?:st|nd|rd|th)?\b/g, "")
    .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/gi, "")
    .replace(/\b\d{4}\b/g, "")
    .replace(/\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, "")
    .replace(/[^a-z]/gi, "");
  return rest.length <= 2 ? date : "";
}

function tidySide(value: string): string {
  return value
    .replace(/\b(applicant|viewer|tenant|negotiator|consultant|telephone|mobile|email|notes|contact)\b[\s\S]*/gi, " ")
    .replace(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, " ")
    .replace(/\b\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}\s+\d{4}\b/gi, " ")
    .replace(/\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, " ")
    .replace(/\b\d{1,2}[:.]\d{2}\s*(?:am|pm)?\b/gi, " ")
    .replace(/\b(?:at|of|the property)\b/gi, " ")
    .replace(/^[\s,.:\-–]+|[\s,.:\-–]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addressFromViewingText(text: string): string {
  const match = text.match(/^(.*)\bviewings?\b(.*)$/i);
  if (!match) return "";
  const after = tidySide(match[2] ?? "");
  const before = tidySide(match[1] ?? "");
  if (looksLikeAddress(after)) return after;
  if (looksLikeAddress(before)) return before;
  if (after.length >= 4 && /\d/.test(after)) return after;
  if (before.length >= 4 && /\d/.test(before)) return before;
  return "";
}

function cleanAddress(address: string, staffName: string): string {
  let text = address.split(/\b(applicant|viewer|tenant|negotiator|consultant|telephone|mobile|email|notes|contact)\b/i)[0] ?? address;
  if (staffName) {
    const escaped = staffName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`\\b${escaped}\\b`, "ig"), " ");
  }
  return text.replace(/\s{2,}/g, " ").replace(/^[,.\-–:\s]+|[,.\s]+$/g, "").trim();
}

function pickStaff(staffCell: string, line: string, current: string): string {
  if (staffCell && staffCell !== line && isPersonName(staffCell)) return staffCell;
  const labelled = line.match(
    /\b(?:negotiator|consultant|staff|accompanied by)\s*[:\-]\s*([A-Z][A-Za-z'’.-]+(?:\s+[A-Z][A-Za-z'’.-]+){1,3})/,
  );
  if (labelled?.[1]) return labelled[1];
  if (current && isPersonName(current)) return current;
  const lead = line.match(/^([A-Z][A-Za-z'’.-]+\s+[A-Z][A-Za-z'’.-]+)\b/);
  if (lead?.[1] && isPersonName(lead[1])) return lead[1];
  return "";
}

function looksLikeAddress(value: string): boolean {
  if (UK_POSTCODE.test(value)) return true;
  return /\d/.test(value) && /[A-Za-z]/.test(value) && value.trim().length > 5;
}

export function parseDiaryMatrix(matrix: string[][]): DraftViewing[] {
  const found = findColumns(matrix);
  const map = found?.map;
  const drafts: DraftViewing[] = [];
  let currentStaff = "";
  let currentDate = "";
  let index = found?.start ?? 0;

  while (index < matrix.length) {
    const rawRow = (matrix[index] ?? []).map((value) => value.trim());
    index += 1;
    if (rawRow.every((value) => !value)) continue;
    const line = rawRow.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!line || isHeaderish(line)) continue;

    const staffCell = map ? cell(rawRow, map.staff) : "";
    const dateCell = map ? cell(rawRow, map.date) : "";
    const impliedViewing = Boolean(map && map.event == null && map.date != null && staffCell && parseUkDate(dateCell));
    if (!isViewingEvent(line) && !impliedViewing) {
      const namedDate = sectionDateOf(line);
      const withoutDate = line
        .replace(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi, " ")
        .replace(/\b\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}\s+\d{4}\b/g, " ")
        .replace(/\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (namedDate && isPersonName(withoutDate)) {
        currentDate = namedDate;
        currentStaff = withoutDate;
      } else if (namedDate) currentDate = namedDate;
      else if (isPersonName(line)) currentStaff = line;
      continue;
    }

    const timeCell = map ? cell(rawRow, map.time) : "";
    const addressCell = map ? cell(rawRow, map.address) : "";
    const eventCell = map ? cell(rawRow, map.event) : "";
    const namedCell = rawRow.find((value) => isPersonName(value)) ?? "";
    const staffName = pickStaff(staffCell || namedCell, line, currentStaff);
    const parsedColumnDate = parseUkDate(dateCell);
    const rawDate = parsedColumnDate ? dateCell : parseUkDate(line) || currentDate;
    const rawTime = parseTime(timeCell) ? timeCell : line;
    let address = "";
    if (addressCell && !isViewingEvent(addressCell) && addressCell.length > 3) address = addressCell;
    if (!address) address = addressFromViewingText(line);
    if (!address && !impliedViewing && index < matrix.length) {
      const nextLine = (matrix[index] ?? []).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      if (
        nextLine &&
        !isViewingEvent(nextLine) &&
        !isPersonName(nextLine) &&
        !sectionDateOf(nextLine) &&
        !isHeaderish(nextLine) &&
        looksLikeAddress(nextLine)
      ) {
        address = nextLine;
        index += 1;
      }
    }
    address = cleanAddress(address, staffName);
    if (staffName) currentStaff = staffName;
    if (parseUkDate(rawDate)) currentDate = parseUkDate(rawDate);

    drafts.push(
      draftFromParts({
        staffName,
        rawDate,
        rawTime,
        event: isViewingEvent(eventCell) ? eventCell : "Viewing",
        address,
        viewerName: map ? cell(rawRow, map.viewer) : "",
        viewerPhone: map ? cell(rawRow, map.phone) : "",
        viewerEmail: map ? cell(rawRow, map.email) : "",
        landlordName: map ? cell(rawRow, map.landlordName) : "",
        landlordEmail: map ? cell(rawRow, map.landlordEmail) : "",
        landlordName2: map ? cell(rawRow, map.landlordName2) : "",
        landlordEmail2: map ? cell(rawRow, map.landlordEmail2) : "",
        notes: map ? cell(rawRow, map.notes) : "",
      }),
    );
  }
  return drafts;
}

function draftFromParts(parts: {
  staffName: string;
  rawDate: string;
  rawTime: string;
  event: string;
  address: string;
  viewerName: string;
  viewerPhone: string;
  viewerEmail: string;
  landlordName: string;
  landlordEmail: string;
  landlordName2: string;
  landlordEmail2: string;
  notes: string;
}): DraftViewing {
  const date = parseUkDate(parts.rawDate);
  const time = parseTime(parts.rawTime);
  const event = parts.event.trim();
  const viewing = isViewingEvent(event);
  let address = parts.address.trim();
  if (!address) address = addressFromEvent(event);
  const issues: string[] = [];
  if (!viewing) issues.push("Not a viewing");
  if (!parts.staffName.trim()) issues.push("Staff not named");
  if (!date) issues.push("Date not read");
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
    landlordName: parts.landlordName.trim(),
    landlordEmail: parts.landlordEmail.trim(),
    landlordName2: parts.landlordName2.trim(),
    landlordEmail2: parts.landlordEmail2.trim(),
    notes: parts.notes.trim(),
    keep,
    issue: keep ? "" : issues[0] ?? "",
  };
}

export function matrixFromText(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const delimiter = lines.some((line) => line.includes("\t")) ? "\t" : ",";
  return lines.map((line) => splitDelimited(line, delimiter));
}

function splitDelimited(line: string, delimiter: string): string[] {
  if (delimiter === "\t") return line.split("\t").map((part) => part.trim());
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
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

function clusterLines(items: PosItem[]): PosItem[][] {
  const sorted = [...items].sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: PosItem[][] = [];
  for (const item of sorted) {
    const line = lines.find(
      (entry) => entry[0] && entry[0].page === item.page && Math.abs(entry[0].y - item.y) <= 3,
    );
    if (line) line.push(item);
    else lines.push([item]);
  }
  for (const line of lines) line.sort((a, b) => a.x - b.x);
  return lines;
}

function lineText(line: PosItem[]): string {
  return line.map((item) => item.str).join(" ");
}

function isHeaderLine(line: PosItem[]): boolean {
  const text = lineText(line);
  return /date/i.test(text) && /time|event|staff|negotiator/i.test(text);
}

function boundsFrom(line: PosItem[]): number[] {
  const starts = line.map((item) => item.x).sort((a, b) => a - b);
  const bounds = [starts[0] - 4];
  for (let index = 1; index < starts.length; index += 1) {
    bounds.push((starts[index - 1] + starts[index]) / 2);
  }
  bounds.push(100000);
  return bounds;
}

function cellsFromLine(line: PosItem[], bounds: number[] | null): string[] {
  if (!bounds) {
    const groups: string[] = [];
    let current = "";
    let lastX = -1000;
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
    let column = bounds.findIndex((start, index) => item.x >= start && item.x < (bounds[index + 1] ?? 100000));
    if (column < 0) column = cells.length - 1;
    cells[column] = `${cells[column]} ${item.str}`.trim();
  }
  return cells;
}

export function matrixFromPositionedText(items: PosItem[]): string[][] {
  const lines = clusterLines(items.filter((item) => item.str.trim()));
  let bounds: number[] | null = null;
  const matrix: string[][] = [];
  for (const line of lines) {
    if (isHeaderLine(line)) bounds = boundsFrom(line);
    matrix.push(cellsFromLine(line, bounds));
  }
  return matrix;
}

export function agencyFromFilename(name: string): "al" | "gr" | "" {
  const text = name.toLowerCase();
  if (/gibbins|richards/.test(text)) return "gr";
  if (/andrew|lees|bridgwater/.test(text)) return "al";
  return "";
}
