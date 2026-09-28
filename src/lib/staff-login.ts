export function staffLoginEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  if (!clean) throw new Error("Enter a username.");
  if (clean.includes("@")) return clean;
  const local = clean.replace(/[^a-z0-9._-]/g, "");
  if (local.length < 3) throw new Error("Usernames need at least 3 letters or numbers.");
  return `${local}@staff.viewingdesk.app`;
}

export function staffUsernameFromEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split("@");
  if (domain === "staff.viewingdesk.app") return local ?? email;
  return email;
}
