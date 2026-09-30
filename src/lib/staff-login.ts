export function staffLoginEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  if (!clean) throw new Error("Enter a username.");
  if (clean.includes("@")) return clean;
  const local = clean.replace(/[^a-z0-9._-]/g, "");
  if (local.length < 3) throw new Error("Usernames need at least 3 letters or numbers.");
  return `${local}@staff.viewingdesk.app`;
}

/** Usernames and emails that should match one login, including a short name like "levi". */
export function loginEmailCandidates(username: string): string[] {
  const clean = username.trim().toLowerCase();
  if (!clean) return [];
  const local = clean.split("@")[0].replace(/[^a-z0-9._-]/g, "");
  const values = [clean];
  if (local) {
    values.push(local, `${local}@staff.viewingdesk.app`, `${local}@gralgroup.co.uk`);
  }
  try {
    values.push(staffLoginEmail(clean));
  } catch {
    /* too short to be a username — the typed value is still a candidate */
  }
  return [...new Set(values)];
}

export function staffUsernameFromEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split("@");
  if (domain === "staff.viewingdesk.app") return local ?? email;
  return email;
}
