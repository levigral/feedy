import { matrixFromPositionedText, matrixFromText, type PosItem } from "@/lib/diary";

export async function matrixFromFile(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    return matrixFromText(await file.text());
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return matrixFromWorkbook(await file.arrayBuffer());
  if (name.endsWith(".pdf")) return matrixFromPdf(await file.arrayBuffer());
  throw new Error("Use a PDF, Excel or CSV diary.");
}

async function matrixFromWorkbook(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const book = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = book.Sheets[book.SheetNames[0] ?? ""];
  if (!sheet || !sheet["!ref"]) return [];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const matrix: string[][] = [];
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const cells: string[] = [];
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as
        | { t?: string; v?: unknown; w?: string; z?: string }
        | undefined;
      cells.push(cellText(cell));
    }
    matrix.push(cells);
  }
  return matrix;
}

function cellText(cell: { t?: string; v?: unknown; w?: string; z?: string } | undefined): string {
  if (!cell) return "";
  if (cell.t === "n" && typeof cell.v === "number" && isDateFormat(cell.z)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(cell.v) * 86400000);
    return date.toISOString().slice(0, 10);
  }
  if (typeof cell.w === "string" && cell.w.trim()) return cell.w.trim();
  if (cell.v == null) return "";
  return String(cell.v).trim();
}

function isDateFormat(format: string | undefined): boolean {
  if (!format) return false;
  const text = format.toLowerCase();
  return /[dmy]/.test(text) && !text.includes("#");
}

async function matrixFromPdf(buffer: ArrayBuffer): Promise<string[][]> {
  const pdfjs = (await import("pdfjs-dist")) as {
    getDocument: (src: { data: Uint8Array }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<PdfPage> }> };
    GlobalWorkerOptions: { workerSrc: string };
  };
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")) as { default: string };
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const items: PosItem[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      const str = "str" in item ? item.str : "";
      const transform = "transform" in item ? item.transform : undefined;
      if (!str?.trim() || !transform) continue;
      items.push({
        str,
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        page: pageNumber,
      });
    }
  }
  return matrixFromPositionedText(items);
}

type PdfPage = {
  getTextContent: () => Promise<{ items: Array<{ str?: string; transform?: number[] }> }>;
};
