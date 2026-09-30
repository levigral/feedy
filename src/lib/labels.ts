export const AGENCIES = [
  {
    id: "al",
    name: "Andrew Lees Lettings",
    email: "bridgwater@andrewleeslettings.co.uk",
  },
  {
    id: "gr",
    name: "Gibbins Richards Lettings",
    email: "lettings@gibbinsrichards.co.uk",
  },
] as const;

export type AgencyId = (typeof AGENCIES)[number]["id"];

export function agencyName(id: string): string {
  return AGENCIES.find((agency) => agency.id === id)?.name ?? "Agency";
}

export function agencyEmail(id: string): string {
  return AGENCIES.find((agency) => agency.id === id)?.email ?? "";
}

export const PROPERTY_STATUSES = ["available", "let_agreed", "withdrawn", "let"] as const;

export function statusLabel(status: string): string {
  switch (status) {
    case "available":
      return "Available";
    case "let_agreed":
      return "Let agreed";
    case "withdrawn":
      return "Withdrawn";
    case "let":
      return "Let";
    case "awaiting":
      return "Awaiting feedback";
    case "requested":
      return "Feedback requested";
    case "received":
      return "Feedback received";
    case "sent":
      return "Feedback sent to landlord";
    case "no_response":
      return "No response";
    case "interested":
      return "Applicant interested";
    case "not_interested":
      return "Applicant not interested";
    case "very_interested":
      return "Very interested";
    case "undecided":
      return "Undecided";
    case "no_feedback":
      return "Feedback not given";
    case "no_show":
      return "No show";
    case "cancelled":
      return "Viewing cancelled";
    default:
      return status;
  }
}

export function isFeedbackComplete(status: string): boolean {
  return status === "sent";
}

export type Tone = "good" | "wait" | "bad" | "neutral";

export function feedbackTone(status: string, days: number): Tone {
  if (isFeedbackComplete(status)) return "good";
  if (status === "requested") return "wait";
  if (days >= 1) return "bad";
  return "neutral";
}

export function ageLabel(days: number, status: string): string {
  if (isFeedbackComplete(status)) return "Done";
  if (days >= 2) return "Overdue";
  if (days >= 1) return "Outstanding";
  return "Today";
}

export function formatUk(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function parseUkDateInput(value: string): string {
  const text = value.trim();
  const uk = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(text);
  if (uk) {
    const day = Number(uk[1]);
    const month = Number(uk[2]);
    const year = Number(uk[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return "";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  return iso ? text : "";
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
