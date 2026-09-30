import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { addressKey, isViewingEvent, reviewDiaryRow, splitPostcode } from "@/lib/diary";
import { agencyEmail, agencyName, isFeedbackComplete } from "@/lib/labels";
import { env } from "@/lib/env.server";
import { sendViaGmail } from "@/lib/gmail-smtp";
import { loginEmailCandidates, staffLoginEmail } from "@/lib/staff-login";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

type Row = Record<string, unknown>;

async function db() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`alter table properties add column if not exists landlord_name_2 text not null default ''`;
  return sql;
}

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

function dateText(value: unknown): string | null {
  const raw = text(value);
  return raw ? raw.slice(0, 10) : null;
}

function mapStaff(row: Row) {
  return {
    id: num(row.id),
    userId: row.user_id ? text(row.user_id) : null,
    name: text(row.name),
    email: text(row.email),
    role: text(row.role || "negotiator"),
    agency: text(row.agency || "al"),
    active: row.active !== false,
    username: text(row.username),
    mustChangePassword: row.must_change_password === true,
    viewings: num(row.viewings),
    done: num(row.done),
    outstanding: num(row.outstanding),
    chased: num(row.historic_viewings) ? Math.round((num(row.historic_done) / num(row.historic_viewings)) * 100) : 100,
    lets: num(row.lets),
    avgDays: row.avg_days == null || row.avg_days === "" ? null : Math.round(num(row.avg_days)),
  };
}

function mapProperty(row: Row) {
  const viewings = num(row.viewing_count);
  const done = num(row.feedback_done);
  return {
    id: num(row.id),
    address: text(row.address),
    postcode: text(row.postcode),
    agency: text(row.agency),
    rent: text(row.rent),
    landlordName: text(row.landlord_name),
    landlordEmail: text(row.landlord_email),
    landlordPhone: text(row.landlord_phone),
    landlordEmail2: text(row.landlord_email_2),
    landlordName2: text(row.landlord_name_2),
    status: text(row.status || "available"),
    marketedOn: dateText(row.marketed_on),
    negotiatorId: row.negotiator_id == null ? null : num(row.negotiator_id),
    negotiatorName: text(row.negotiator_name),
    notes: text(row.notes),
    letAgreedOn: dateText(row.let_agreed_on),
    letAgreedBy: row.let_agreed_by == null ? null : num(row.let_agreed_by),
    letAgreedByName: text(row.let_agreed_by_name),
    viewings,
    feedbackDone: done,
    historicViewings: row.historic_viewings == null ? null : num(row.historic_viewings),
    historicDone: row.historic_done == null ? null : num(row.historic_done),
    firstViewing: dateText(row.first_viewing),
  };
}

function mapViewing(row: Row) {
  const status = text(row.feedback_status || "awaiting");
  const days = num(row.days);
  return {
    id: num(row.id),
    propertyId: num(row.property_id),
    address: text(row.address),
    postcode: text(row.postcode),
    agency: text(row.agency),
    viewedOn: dateText(row.viewed_on) ?? "",
    time: text(row.viewed_at),
    viewerName: text(row.viewer_name),
    viewerPhone: text(row.viewer_phone),
    viewerEmail: text(row.viewer_email),
    negotiatorId: row.negotiator_id == null ? null : num(row.negotiator_id),
    negotiatorName: text(row.negotiator_name),
    notes: text(row.notes),
    status,
    interest: text(row.interest),
    feedbackText: text(row.feedback_text),
    feedback: safeJson(text(row.feedback_json)),
    days,
    landlordName: text(row.landlord_name),
    landlordEmail: text(row.landlord_email),
    landlordEmail2: text(row.landlord_email_2),
    landlordPhone: text(row.landlord_phone),
    applicationStatus: text(row.application_status),
  };
}

function safeJson(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw || "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, text(value)]));
  } catch {
    return {};
  }
}

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function namesMatch(left: string, right: string): boolean {
  const a = norm(left);
  const b = norm(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const leftTokens = left.toLowerCase().split(/\s+/).filter(Boolean);
  const rightTokens = right.toLowerCase().split(/\s+/).filter(Boolean);
  if (leftTokens.length === 1 && rightTokens[0] === leftTokens[0]) return true;
  if (rightTokens.length === 1 && leftTokens[0] === rightTokens[0]) return true;
  return false;
}

function keysMatch(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  return shorter.length >= 8 && longer.startsWith(shorter);
}

function titleName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

async function ensureMe(userId: string) {
  const sql = await ensureStaffLoginColumns();
  const users = await sql<{ name: string; email: string }>`
    select "name" as name, "email" as email from "user" where "id" = ${userId} limit 1
  `;
  const name = users[0]?.name?.trim() || "Staff";
  const email = users[0]?.email?.trim() || "";
  const linked = await sql<Row>`select * from staff where user_id = ${userId} limit 1`;
  if (linked[0]) {
    const isOwner = text(linked[0].username).toLowerCase() === ADMIN_USERNAME || email.toLowerCase() === ADMIN_USERNAME;
    if (isOwner && text(linked[0].name) !== "Levi Holland") {
      const updated = await sql<Row>`update staff set name = 'Levi Holland' where id = ${num(linked[0].id)} returning *`;
      await sql`update "user" set "name" = 'Levi Holland', "updatedAt" = now() where "id" = ${userId}`;
      return mapStaff(updated[0] ?? linked[0]);
    }
    return mapStaff(linked[0]);
  }
  if (email) {
    const byEmail = await sql<Row>`
      select * from staff where user_id is null and lower(email) = lower(${email}) limit 1
    `;
    if (byEmail[0]) {
      const updated = await sql<Row>`
        update staff set user_id = ${userId} where id = ${num(byEmail[0].id)} returning *
      `;
      return mapStaff(updated[0] ?? byEmail[0]);
    }
  }
  const all = await sql<Row>`select * from staff`;
  const named = all.find((row) => !row.user_id && norm(text(row.name)) === norm(name));
  if (named) {
    const updated = await sql<Row>`
      update staff set user_id = ${userId}, email = case when email = '' then ${email} else email end
      where id = ${num(named.id)} returning *
    `;
    return mapStaff(updated[0] ?? named);
  }
  const count = await sql<{ n: number }>`select count(*)::int as n from staff where user_id is not null`;
  const role = num(count[0]?.n) === 0 ? "admin" : "negotiator";
  const inserted = await sql<Row>`
    insert into staff (user_id, name, email, role, agency)
    values (${userId}, ${name}, ${email}, ${role}, 'al')
    returning *
  `;
  return mapStaff(inserted[0] ?? {});
}

function assertManager(role: string) {
  if (role !== "admin" && role !== "manager") throw new Error("Only a manager can change that.");
}

async function ensureGmailMailbox() {
  const sql = await db();
  await sql`alter table mailboxes add column if not exists kind text not null default 'graph'`;
  await sql`
    insert into mailboxes (agency, from_address, from_name, kind)
    values
      ('gmail', '', 'Gmail trial', 'smtp'),
      ('al', 'bridgwater@andrewleeslettings.co.uk', 'Andrew Lees Lettings', 'graph'),
      ('gr', 'lettings@gibbinsrichards.co.uk', 'Gibbins Richards Lettings', 'graph')
    on conflict (agency) do nothing
  `;
  return sql;
}

async function ensureApplicationColumn() {
  const sql = await db();
  await sql`alter table viewings add column if not exists application_status text not null default ''`;
  return sql;
}

async function ensureStaffLoginColumns() {
  const sql = await db();
  await sql`alter table staff add column if not exists username text not null default ''`;
  await sql`alter table staff add column if not exists must_change_password boolean not null default false`;
  return sql;
}

const ADMIN_USERNAME = "levi@gralgroup.co.uk";
const ADMIN_PASSWORD = "Lettings123!";

async function upsertCredential(userId: string, password: string) {
  const sql = await db();
  const hash = await hashPassword(password);
  const existing = await sql<{ id: string }>`
    select "id" as id from "account" where "userId" = ${userId} and "providerId" = 'credential' limit 1
  `;
  if (existing[0]) {
    await sql`
      update "account" set "password" = ${hash}, "updatedAt" = now() where "id" = ${existing[0].id}
    `;
    return;
  }
  await sql`
    insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
    values (${randomUUID()}, ${userId}, 'credential', ${userId}, ${hash}, now(), now())
  `;
}

async function createCredentialUser(name: string, username: string, password: string) {
  const sql = await db();
  const email = staffLoginEmail(username);
  const found = await sql<{ id: string }>`select "id" as id from "user" where lower("email") = lower(${email}) limit 1`;
  if (found[0]) {
    await upsertCredential(found[0].id, password);
    await sql`update "user" set "name" = ${name}, "updatedAt" = now() where "id" = ${found[0].id}`;
    return found[0].id;
  }
  const id = randomUUID();
  await sql`
    insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
    values (${id}, ${name}, ${email}, true, now(), now())
  `;
  await upsertCredential(id, password);
  return id;
}

export const prepareSignIn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureOwnerLogin();
  return { username: ADMIN_USERNAME };
});

async function ensureOwnerLogin() {
  const sql = await ensureStaffLoginColumns();
  const existing = await sql<Row>`select id, user_id, name from staff where lower(username) = ${ADMIN_USERNAME} limit 1`;
  const password = env("ADMIN_INITIAL_PASSWORD") || ADMIN_PASSWORD;
  const email = staffLoginEmail(ADMIN_USERNAME);
  const found = await sql<{ id: string }>`select "id" as id from "user" where lower("email") = lower(${email}) limit 1`;
  let userId = found[0]?.id ?? "";
  if (!userId) {
    userId = await createCredentialUser("Levi Holland", ADMIN_USERNAME, password);
  } else {
    const accounts = await sql<{ password: string | null }>`
      select "password" as password from "account" where "userId" = ${userId} and "providerId" = 'credential' limit 1
    `;
    if (!accounts[0]?.password) await upsertCredential(userId, password);
    await sql`update "user" set "name" = 'Levi Holland', "emailVerified" = true, "updatedAt" = now() where "id" = ${userId}`;
  }
  if (existing[0]) {
    await sql`
      update staff set user_id = ${userId}, name = 'Levi Holland', email = ${email},
        username = ${ADMIN_USERNAME}, role = 'admin', active = true, must_change_password = false
      where id = ${num(existing[0].id)}
    `;
  } else {
    await sql`
      insert into staff (user_id, name, email, username, role, agency, active, must_change_password)
      values (${userId}, 'Levi Holland', ${email}, ${ADMIN_USERNAME}, 'admin', 'al', true, false)
    `;
  }
  return userId;
}

/** Map whatever was typed (username or email) to the login email Better Auth stores. */
export const resolveLogin = createServerFn({ method: "POST" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    await ensureOwnerLogin();
    const sql = await ensureStaffLoginColumns();
    const wanted = new Set(loginEmailCandidates(data.username ?? ""));
    if (wanted.size === 0) throw new Error("Enter a username.");
    const rows = await sql<Row>`select email, username, active from staff`;
    const match = rows.find((row) => {
      const username = text(row.username).toLowerCase();
      const email = text(row.email).toLowerCase();
      return wanted.has(username) || wanted.has(email) || wanted.has(username.split("@")[0]);
    });
    if (match && match.active === false) throw new Error("This login has been switched off. Ask Levi to turn it back on.");
    const email = match
      ? staffLoginEmail(text(match.username) || text(match.email))
      : staffLoginEmail(data.username);
    return { email };
  });

async function logActivity(propertyId: number, kind: string, detail: string, actor: string, viewingId?: number) {
  const sql = await db();
  await sql`
    insert into activity (property_id, viewing_id, kind, detail, actor)
    values (${propertyId}, ${viewingId ?? null}, ${kind}, ${detail}, ${actor})
  `;
}

const DONE = `('sent')`;

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => ensureMe(context.userId));

export const getBoard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { agency?: string; range?: string; negotiatorId?: number }) => data ?? {})
  .handler(async ({ data, context }) => {
    await ensureMe(context.userId);
    const sql = await ensureApplicationColumn();
    const agency = data.agency === "al" || data.agency === "gr" ? data.agency : "";
    const negotiatorId = data.negotiatorId ? num(data.negotiatorId) : 0;
    const range = data.range === "today" || data.range === "week" || data.range === "month" ? data.range : "all";
    const filters = ["true"];
    const params: unknown[] = [];
    if (agency) {
      params.push(agency);
      filters.push(`p.agency = $${params.length}`);
    }
    if (negotiatorId) {
      params.push(negotiatorId);
      filters.push(`v.negotiator_id = $${params.length}`);
    }
    const rangeSql =
      range === "today"
        ? "and v.viewed_on = current_date"
        : range === "week"
          ? "and v.viewed_on >= date_trunc('week', current_date)::date"
          : range === "month"
            ? "and v.viewed_on >= date_trunc('month', current_date)::date"
            : "";
    const where = filters.join(" and ");
    const totals = await sql.query<Row>(
      `select count(*)::int as viewings,
        count(*) filter (where v.feedback_status in ${DONE})::int as done,
        count(*) filter (where v.interest in ('interested','very_interested') or v.feedback_status = 'interested')::int as interested
       from viewings v join properties p on p.id = v.property_id
       where ${where} ${rangeSql}`,
      params,
    );
    const active = await sql.query<{ n: number }>(
      `select count(*)::int as n from properties p where p.status = 'available' ${agency ? "and p.agency = $1" : ""}`,
      agency ? [agency] : [],
    );
    const outstanding = await sql.query<Row>(
      `select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
       from viewings v
       join properties p on p.id = v.property_id
       left join staff s on s.id = v.negotiator_id
       where v.feedback_status not in ${DONE} ${agency ? "and p.agency = $1" : ""} ${negotiatorId ? `and v.negotiator_id = $${agency ? 2 : 1}` : ""}
       order by v.viewed_on asc, v.viewed_at asc`,
      [...(agency ? [agency] : []), ...(negotiatorId ? [negotiatorId] : [])],
    );
    const listed = await sql.query<Row>(
      `select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
       from viewings v
       join properties p on p.id = v.property_id
       left join staff s on s.id = v.negotiator_id
       where ${where} ${rangeSql}
       order by v.viewed_on desc, v.viewed_at desc`,
      params,
    );
    const matched = listed.map(mapViewing);
    const keenRows = await sql.query<Row>(
      `select v.*, p.address, p.postcode, p.agency, p.status as property_status, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
       from viewings v
       join properties p on p.id = v.property_id
       left join staff s on s.id = v.negotiator_id
       where ${where} and v.interest in ('interested', 'very_interested')
       order by v.viewed_on desc, v.viewed_at desc`,
      params,
    );
    const keen = keenRows.map(mapViewing);
    const followUps = keen.filter((row) => !row.applicationStatus);
    const applications = keenRows
      .filter((row) => text(row.application_status) === "across" && text(row.property_status) !== "let_agreed")
      .map(mapViewing);
    const declined = keenRows.filter((row) => text(row.application_status) === "declined").map(mapViewing);
    const accepted = keenRows.filter((row) => text(row.application_status) === "accepted").map(mapViewing);
    const staff = await staffStats(agency);
    const viewings = num(totals[0]?.viewings);
    const done = num(totals[0]?.done);
    const historic = await sql.query<Row>(
      `select count(*)::int as viewings,
        count(*) filter (where v.feedback_status in ${DONE})::int as done
       from viewings v join properties p on p.id = v.property_id
       where ${where} ${rangeSql} and v.viewed_on < current_date`,
      params,
    );
    const historicViewings = num(historic[0]?.viewings);
    const historicDone = num(historic[0]?.done);
    return {
      activeProperties: num(active[0]?.n),
      viewings,
      done,
      outstanding: viewings - done,
      percent: historicViewings ? Math.round((historicDone / historicViewings) * 100) : 100,
      interested: followUps.length,
      applications: applications.length,
      attention: outstanding.length,
      queue: outstanding.map(mapViewing),
      matched,
      doneQueue: matched.filter((row) => isFeedbackComplete(row.status)),
      interestedQueue: followUps,
      applicationQueue: applications,
      declinedQueue: declined,
      acceptedQueue: accepted,
      staff,
    };
  });

async function staffStats(agency: string) {
  const sql = await db();
  const rows = await sql.query<Row>(
    `select s.*,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id ${agency ? "and p.agency = $1" : ""}) as viewings,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id and v.feedback_status in ${DONE} ${agency ? "and p.agency = $1" : ""}) as done,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id and v.feedback_status not in ${DONE} ${agency ? "and p.agency = $1" : ""}) as outstanding,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id and v.viewed_on < current_date ${agency ? "and p.agency = $1" : ""}) as historic_viewings,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id and v.viewed_on < current_date and v.feedback_status in ${DONE} ${agency ? "and p.agency = $1" : ""}) as historic_done,
      (select count(*)::int from properties p where p.let_agreed_by = s.id ${agency ? "and p.agency = $1" : ""}) as lets,
      (select avg((p.let_agreed_on - (select min(v.viewed_on) from viewings v where v.property_id = p.id)))
        from properties p where p.let_agreed_by = s.id and p.let_agreed_on is not null ${agency ? "and p.agency = $1" : ""}) as avg_days
     from staff s
     where s.active = true
     order by s.name`,
    agency ? [agency] : [],
  );
  return rows.map(mapStaff);
}

export const listProperties = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureMe(context.userId);
    const sql = await db();
    const rows = await sql<Row>`
      select p.*, s.name as negotiator_name, g.name as let_agreed_by_name,
        (select count(*)::int from viewings v where v.property_id = p.id) as viewing_count,
        (select count(*)::int from viewings v where v.property_id = p.id and v.feedback_status = 'sent') as feedback_done,
        (select min(v.viewed_on) from viewings v where v.property_id = p.id) as first_viewing
      from properties p
      left join staff s on s.id = p.negotiator_id
      left join staff g on g.id = p.let_agreed_by
      order by p.address
    `;
    return rows.map(mapProperty);
  });

export const getProperty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    await ensureMe(context.userId);
    const sql = await db();
    const id = num(data.id);
    const rows = await sql<Row>`
      select p.*, s.name as negotiator_name, g.name as let_agreed_by_name,
        (select count(*)::int from viewings v where v.property_id = p.id) as viewing_count,
        (select count(*)::int from viewings v where v.property_id = p.id and v.feedback_status = 'sent') as feedback_done,
        (select count(*)::int from viewings v where v.property_id = p.id and v.viewed_on < current_date) as historic_viewings,
        (select count(*)::int from viewings v where v.property_id = p.id and v.viewed_on < current_date and v.feedback_status = 'sent') as historic_done,
        (select min(v.viewed_on) from viewings v where v.property_id = p.id) as first_viewing
      from properties p
      left join staff s on s.id = p.negotiator_id
      left join staff g on g.id = p.let_agreed_by
      where p.id = ${id}
    `;
    if (!rows[0]) throw new Error("Property not found");
    const viewings = await sql<Row>`
      select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2, p.landlord_phone,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
      from viewings v
      join properties p on p.id = v.property_id
      left join staff s on s.id = v.negotiator_id
      where v.property_id = ${id}
      order by v.viewed_on desc, v.viewed_at desc
    `;
    const activity = await sql<Row>`
      select kind, detail, actor, created_at from activity where property_id = ${id} order by created_at desc limit 40
    `;
    const emails = await sql<Row>`
      select e.*, s.name as sender from emails e
      left join staff s on s.id = e.sent_by
      where e.viewing_id in (select id from viewings where property_id = ${id})
      order by e.sent_at desc
    `;
    return {
      property: mapProperty(rows[0]),
      viewings: viewings.map(mapViewing),
      activity: activity.map((row) => ({
        kind: text(row.kind),
        detail: text(row.detail),
        actor: text(row.actor),
        at: text(row.created_at),
      })),
      emails: emails.map((row) => ({
        id: num(row.id),
        viewingId: num(row.viewing_id),
        from: text(row.from_address),
        to: text(row.to_address),
        subject: text(row.subject),
        body: text(row.body),
        status: text(row.status),
        error: text(row.error),
        sender: text(row.sender),
        sentAt: text(row.sent_at),
      })),
    };
  });

type PropertyInput = {
  id?: number;
  address: string;
  postcode: string;
  agency: string;
  rent: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  landlordEmail2: string;
  landlordName2: string;
  status: string;
  marketedOn: string;
  negotiatorId: number | null;
  notes: string;
};

export const saveProperty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: PropertyInput) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const address = data.address.trim();
    if (!address) throw new Error("Enter the property address.");
    const agency = data.agency === "gr" ? "gr" : "al";
    const sql = await db();
    const split = splitPostcode(`${address} ${data.postcode ?? ""}`);
    const postcode = (data.postcode || split.postcode).trim();
    const key = addressKey(`${address} ${postcode}`);
    const marketed = data.marketedOn || null;
    const negotiator = data.negotiatorId || null;
    if (data.id) {
      await sql.query(
        `update properties set address=$1, address_key=$2, postcode=$3, agency=$4, rent=$5,
          landlord_name=$6, landlord_email=$7, landlord_phone=$8, landlord_email_2=$9, landlord_name_2=$10, status=$11,
          marketed_on=$12, negotiator_id=$13, notes=$14 where id=$15`,
        [
          address,
          key,
          postcode,
          agency,
          data.rent ?? "",
          data.landlordName ?? "",
          data.landlordEmail ?? "",
          data.landlordPhone ?? "",
          data.landlordEmail2 ?? "",
          data.landlordName2 ?? "",
          data.status || "available",
          marketed,
          negotiator,
          data.notes ?? "",
          data.id,
        ],
      );
      await logActivity(data.id, "Property updated", address, me.name);
      return { id: data.id };
    }
    const inserted = await sql<{ id: number }>`
      insert into properties (
        address, address_key, postcode, agency, rent, landlord_name, landlord_email, landlord_phone,
        landlord_email_2, landlord_name_2, status, marketed_on, negotiator_id, notes
      ) values (
        ${address}, ${key}, ${postcode}, ${agency}, ${data.rent ?? ""}, ${data.landlordName ?? ""},
        ${data.landlordEmail ?? ""}, ${data.landlordPhone ?? ""}, ${data.landlordEmail2 ?? ""}, ${data.landlordName2 ?? ""},
        ${data.status || "available"}, ${marketed}, ${negotiator}, ${data.notes ?? ""}
      ) returning id
    `;
    const id = num(inserted[0]?.id);
    await logActivity(id, "Property added", address, me.name);
    return { id };
  });

export const saveLandlord = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: { propertyId: number; landlordName: string; landlordEmail: string; landlordEmail2: string; landlordName2?: string; landlordPhone: string }) =>
      data,
  )
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const sql = await db();
    const email = data.landlordEmail.trim();
    const name2 = data.landlordName2 == null ? null : data.landlordName2.trim();
    await sql`
      update properties set
        landlord_name = ${data.landlordName.trim()},
        landlord_email = ${email},
        landlord_email_2 = ${data.landlordEmail2.trim()},
        landlord_name_2 = coalesce(${name2}, landlord_name_2),
        landlord_phone = ${data.landlordPhone.trim()}
      where id = ${num(data.propertyId)}
    `;
    await logActivity(num(data.propertyId), "Landlord updated", email || "Contact details saved", me.name);
    return { ok: true };
  });

export const setLetAgreed = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number; staffId: number; on: string; revert?: boolean }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const sql = await db();
    if (data.revert) {
      await sql`update properties set status = 'available', let_agreed_on = null, let_agreed_by = null where id = ${data.id}`;
      await logActivity(data.id, "Back on the market", "Let agreed was cancelled", me.name);
      return { ok: true };
    }
    const on = data.on || new Date().toISOString().slice(0, 10);
    await sql`
      update properties set status = 'let_agreed', let_agreed_on = ${on}, let_agreed_by = ${data.staffId}
      where id = ${data.id}
    `;
    await logActivity(data.id, "Let agreed", `Marked let agreed on ${on}`, me.name);
    return { ok: true };
  });

export const archiveProperty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number; hard?: boolean }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    assertManager(me.role);
    const sql = await db();
    if (data.hard) {
      if (me.role !== "admin") throw new Error("Only an administrator can delete a property.");
      await sql`delete from emails where viewing_id in (select id from viewings where property_id = ${data.id})`;
      await sql`delete from activity where property_id = ${data.id}`;
      await sql`delete from viewings where property_id = ${data.id}`;
      await sql`delete from properties where id = ${data.id}`;
      return { ok: true };
    }
    await sql`update properties set status = 'withdrawn' where id = ${data.id}`;
    await logActivity(data.id, "Withdrawn", "Property archived", me.name);
    return { ok: true };
  });

type ViewingInput = {
  propertyId: number;
  date: string;
  time: string;
  viewerName: string;
  viewerPhone: string;
  viewerEmail: string;
  negotiatorId: number;
  notes: string;
  immediate: boolean;
};

export const addViewing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: ViewingInput) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    if (!data.date) throw new Error("Enter the viewing date.");
    const sql = await db();
    const status = data.immediate ? "received" : "awaiting";
    const inserted = await sql<{ id: number }>`
      insert into viewings (
        property_id, viewed_on, viewed_at, viewer_name, viewer_phone, viewer_email, negotiator_id, notes, feedback_status
      ) values (
        ${data.propertyId}, ${data.date}, ${data.time ?? ""}, ${data.viewerName ?? ""}, ${data.viewerPhone ?? ""},
        ${data.viewerEmail ?? ""}, ${data.negotiatorId || null}, ${data.notes ?? ""}, ${status}
      ) returning id
    `;
    await logActivity(
      data.propertyId,
      "Viewing booked",
      `${data.date} ${data.time} ${data.viewerName}`.trim(),
      me.name,
      num(inserted[0]?.id),
    );
    return { id: num(inserted[0]?.id) };
  });

export const saveFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      id: number;
      interest: string;
      feedbackText: string;
      fields: Record<string, string>;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const sql = await db();
    const current = await sql<Row>`select feedback_status, property_id from viewings where id = ${data.id}`;
    if (!current[0]) throw new Error("Viewing not found");
    let status = "received";
    if (data.interest === "no_feedback") status = "awaiting";
    else if (data.interest === "very_interested" || data.interest === "interested") status = "interested";
    else if (data.interest === "not_interested") status = "not_interested";
    else if (text(current[0].feedback_status) === "sent") status = "sent";
    const note = data.feedbackText.trim();
    await sql`
      update viewings set interest = ${data.interest}, feedback_text = ${note},
        feedback_json = ${JSON.stringify(data.fields ?? {})}, feedback_status = ${status}
      where id = ${data.id}
    `;
    await logActivity(num(current[0].property_id), "Feedback received", note.slice(0, 180) || data.interest, me.name, data.id);
    return { ok: true };
  });

export const markContacted = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const sql = await db();
    const current = await sql<Row>`select feedback_status, property_id from viewings where id = ${data.id}`;
    if (!current[0]) throw new Error("Viewing not found");
    if (!isFeedbackComplete(text(current[0].feedback_status))) {
      await sql`update viewings set feedback_status = 'requested' where id = ${data.id}`;
    }
    await logActivity(num(current[0].property_id), "Feedback requested", "Applicant contacted", me.name, data.id);
    return { ok: true };
  });

export const markApplication = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number; across: boolean }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const sql = await ensureApplicationColumn();
    const current = await sql<Row>`select property_id, viewer_name from viewings where id = ${data.id}`;
    if (!current[0]) throw new Error("Viewing not found");
    const status = data.across ? "across" : "";
    await sql`update viewings set application_status = ${status} where id = ${data.id}`;
    await logActivity(
      num(current[0].property_id),
      data.across ? "Application sent to landlord" : "Application moved back",
      text(current[0].viewer_name) || "Viewer",
      me.name,
      data.id,
    );
    return { ok: true };
  });

export const decideApplication = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number; decision: "accepted" | "declined" | "undo" }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    if (data.decision !== "accepted" && data.decision !== "declined" && data.decision !== "undo") {
      throw new Error("Choose accepted, declined, or undo.");
    }
    const sql = await ensureApplicationColumn();
    const current = await sql<Row>`select property_id, viewer_name, negotiator_id, application_status from viewings where id = ${data.id}`;
    if (!current[0]) throw new Error("Viewing not found");
    const propertyId = num(current[0].property_id);
    const viewer = text(current[0].viewer_name) || "Viewer";
    if (data.decision === "undo") {
      const wasAccepted = text(current[0].application_status) === "accepted";
      await sql`update viewings set application_status = 'across' where id = ${data.id}`;
      if (wasAccepted) {
        const others = await sql<{ n: number }>`
          select count(*)::int as n from viewings
          where property_id = ${propertyId} and id <> ${data.id} and application_status = 'accepted'
        `;
        if (num(others[0]?.n) === 0) {
          await sql`
            update properties set status = 'available', let_agreed_on = null, let_agreed_by = null
            where id = ${propertyId} and status = 'let_agreed'
          `;
        }
        await logActivity(propertyId, "Accept undone", `${viewer} is back on applications. Property is no longer let agreed.`, me.name, data.id);
        return { ok: true };
      }
      await logActivity(propertyId, "Decline undone", `${viewer} is back on applications`, me.name, data.id);
      return { ok: true };
    }
    if (data.decision === "declined") {
      await sql`update viewings set application_status = 'declined' where id = ${data.id}`;
      await logActivity(propertyId, "Application declined", viewer, me.name, data.id);
      return { ok: true };
    }
    const staffId = num(current[0].negotiator_id) || me.id;
    const on = new Date().toISOString().slice(0, 10);
    await sql`update viewings set application_status = 'accepted' where id = ${data.id}`;
    await sql`
      update properties set status = 'let_agreed', let_agreed_on = ${on}, let_agreed_by = ${staffId}
      where id = ${propertyId}
    `;
    await logActivity(propertyId, "Let agreed", `Application accepted for ${viewer}`, me.name, data.id);
    return { ok: true };
  });

export const listViewings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data?: Record<string, never>) => data ?? {})
  .handler(async ({ context }) => {
    await ensureMe(context.userId);
    const sql = await db();
    const rows = await sql<Row>`
      select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
      from viewings v
      join properties p on p.id = v.property_id
      left join staff s on s.id = v.negotiator_id
      order by v.viewed_on desc, v.viewed_at desc
    `;
    return rows.map(mapViewing);
  });

type ImportRow = {
  staffName: string;
  date: string;
  time: string;
  address: string;
  viewerName: string;
  viewerPhone: string;
  viewerEmail: string;
  notes: string;
  agency: string;
  event: string;
  landlordName?: string;
  landlordEmail?: string;
  landlordName2?: string;
  landlordEmail2?: string;
  reuseId?: number;
  forceNew?: boolean;
};

function historicStatus(status: string): boolean {
  return status === "let_agreed" || status === "let";
}

export const importDiary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { rows: ImportRow[] }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const sql = await db();
    const properties = await sql<Row>`
      select id, address, postcode, address_key, agency, status, landlord_name, landlord_email, landlord_name_2, landlord_email_2 from properties
    `;
    const people = await sql<Row>`select id, name, user_id from staff`;
    let createdProperties = 0;
    let createdViewings = 0;
    let namedViewings = 0;
    let skipped = 0;
    const createdStaff: string[] = [];
    const propertyRows = [...properties];
    const staffRows = [...people];
    const held = new Map<number, {
      propertyId: number;
      address: string;
      status: string;
      landlordName: string;
      landlordEmail: string;
      landlordName2: string;
      landlordEmail2: string;
      rows: ImportRow[];
    }>();

    for (const row of data.rows ?? []) {
      const staffName = titleName(row.staffName || "");
      const date = (row.date || "").slice(0, 10);
      const address = (row.address || "").trim();
      const agency = row.agency === "gr" ? "gr" : "al";
      if (!staffName || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !address || !isViewingEvent(row.event || "Viewing")) {
        skipped += 1;
        continue;
      }
      const problems = reviewDiaryRow({
        staffName,
        date,
        time: row.time || "",
        address,
        viewerName: row.viewerName || "",
        viewerEmail: row.viewerEmail || "",
        landlordEmail: row.landlordEmail || "",
        landlordEmail2: row.landlordEmail2 || "",
      });
      if (problems.length) {
        skipped += 1;
        continue;
      }
      let staff = staffRows.find((person) => namesMatch(text(person.name), staffName) && norm(text(person.name)) === norm(staffName));
      if (!staff) {
        const loose = staffRows.filter((person) => namesMatch(text(person.name), staffName));
        staff = loose.length === 1 ? loose[0] : undefined;
      }
      if (!staff) {
        const inserted = await sql<Row>`
          insert into staff (name, role, agency, active) values (${staffName}, 'negotiator', ${agency}, true) returning id, name, user_id
        `;
        staff = inserted[0];
        if (staff) {
          staffRows.push(staff);
          createdStaff.push(text(staff.name));
        }
      }
      const staffId = num(staff?.id);
      const key = addressKey(address);
      const landlordName = (row.landlordName || "").trim();
      const landlordEmail = (row.landlordEmail || "").trim();
      const landlordName2 = (row.landlordName2 || "").trim();
      const landlordEmail2 = (row.landlordEmail2 || "").trim();
      const sameAddress = (item: Row) =>
        keysMatch(text(item.address_key), key) || keysMatch(addressKey(`${text(item.address)} ${text(item.postcode)}`), key);
      let property = row.reuseId ? propertyRows.find((item) => num(item.id) === num(row.reuseId)) : undefined;
      if (property && historicStatus(text(property.status))) {
        await sql`update properties set status = 'available' where id = ${num(property.id)}`;
        property.status = "available";
        await logActivity(num(property.id), "Back on the market", "New viewing imported. Previous landlord details kept.", me.name);
      }
      if (!property && !row.forceNew) {
        const matches = propertyRows.filter(sameAddress);
        const live = matches.find((item) => !historicStatus(text(item.status)));
        const past = matches.find((item) => historicStatus(text(item.status)));
        if (live) property = live;
        else if (past) {
          const propertyId = num(past.id);
          const group = held.get(propertyId) ?? {
            propertyId,
            address: text(past.address),
            status: text(past.status),
            landlordName: text(past.landlord_name),
            landlordEmail: text(past.landlord_email),
            landlordName2: text(past.landlord_name_2),
            landlordEmail2: text(past.landlord_email_2),
            rows: [],
          };
          group.rows.push(row);
          held.set(propertyId, group);
          continue;
        }
      }
      if (!property) {
        const split = splitPostcode(address);
        const inserted = await sql<Row>`
          insert into properties (
            address, address_key, postcode, agency, landlord_name, landlord_email, landlord_name_2, landlord_email_2, status, marketed_on, negotiator_id, notes
          ) values (
            ${split.address || address}, ${key}, ${split.postcode}, ${agency},
            ${landlordName || "To be added"}, ${landlordEmail}, ${landlordName2}, ${landlordEmail2},
            'available', ${date}, ${staffId}, ''
          ) returning id, address, postcode, address_key, agency, status, landlord_name, landlord_email, landlord_name_2, landlord_email_2
        `;
        property = inserted[0];
        if (property) {
          propertyRows.push(property);
          createdProperties += 1;
          await logActivity(num(property.id), "Property added", "Created from the diary", me.name);
        }
      } else if (!row.reuseId && (landlordName || landlordEmail || landlordName2 || landlordEmail2)) {
        const currentName = text(property.landlord_name);
        const nextName = !currentName || currentName === "To be added" ? landlordName || currentName : currentName;
        const nextEmail = text(property.landlord_email) || landlordEmail;
        const nextName2 = text(property.landlord_name_2) || landlordName2;
        const nextEmail2 = text(property.landlord_email_2) || landlordEmail2;
        if (
          nextName !== currentName ||
          nextEmail !== text(property.landlord_email) ||
          nextName2 !== text(property.landlord_name_2) ||
          nextEmail2 !== text(property.landlord_email_2)
        ) {
          await sql`
            update properties set
              landlord_name = ${nextName},
              landlord_email = ${nextEmail},
              landlord_name_2 = ${nextName2},
              landlord_email_2 = ${nextEmail2}
            where id = ${num(property.id)}
          `;
          property.landlord_name = nextName;
          property.landlord_email = nextEmail;
          property.landlord_name_2 = nextName2;
          property.landlord_email_2 = nextEmail2;
        }
      }
      const propertyId = num(property?.id);
      const viewer = (row.viewerName || "").trim();
      const viewerPhone = (row.viewerPhone || "").trim();
      const viewerEmail = (row.viewerEmail || "").trim();
      const exact = await sql<{ id: number }>`
        select id from viewings
        where property_id = ${propertyId} and viewed_on = ${date} and viewed_at = ${row.time || ""}
          and negotiator_id = ${staffId} and lower(viewer_name) = lower(${viewer})
        limit 1
      `;
      if (exact[0]) {
        skipped += 1;
        continue;
      }
      if (viewer) {
        const blank = await sql<{ id: number }>`
          select id from viewings
          where property_id = ${propertyId} and viewed_on = ${date} and viewed_at = ${row.time || ""}
            and negotiator_id = ${staffId} and viewer_name = ''
          limit 1
        `;
        if (blank[0]) {
          await sql`
            update viewings set viewer_name = ${viewer},
              viewer_phone = case when viewer_phone = '' then ${viewerPhone} else viewer_phone end,
              viewer_email = case when viewer_email = '' then ${viewerEmail} else viewer_email end
            where id = ${num(blank[0].id)}
          `;
          namedViewings += 1;
          continue;
        }
      }
      const insertedViewing = await sql<{ id: number }>`
        insert into viewings (property_id, viewed_on, viewed_at, viewer_name, viewer_phone, viewer_email, negotiator_id, notes)
        values (
          ${propertyId}, ${date}, ${row.time || ""}, ${viewer}, ${viewerPhone}, ${viewerEmail},
          ${staffId}, ${row.notes || ""}
        ) returning id
      `;
      createdViewings += 1;
      await logActivity(
        propertyId,
        "Viewing booked",
        `${date} ${row.time} · ${staffName}${viewer ? ` · ${viewer}` : ""}`,
        me.name,
        num(insertedViewing[0]?.id),
      );
    }
    return { createdProperties, createdViewings, namedViewings, createdStaff, skipped, letAgreed: [...held.values()] };
  });

export const deleteViewing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    if (me.role !== "admin") throw new Error("Only an administrator can delete a viewing.");
    const sql = await db();
    const id = num(data.id);
    const rows = await sql<Row>`select id, property_id, viewed_on, viewed_at from viewings where id = ${id} limit 1`;
    const viewing = rows[0];
    if (!viewing) throw new Error("Viewing not found");
    await sql`delete from emails where viewing_id = ${id}`;
    await sql`delete from activity where viewing_id = ${id}`;
    await sql`delete from viewings where id = ${id}`;
    await logActivity(
      num(viewing.property_id),
      "Viewing deleted",
      `${text(viewing.viewed_on)} ${text(viewing.viewed_at)}`.trim(),
      me.name,
    );
    return { ok: true };
  });

export const listStaff = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureMe(context.userId);
    return staffStats("");
  });

export const saveStaff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      id?: number;
      name: string;
      email: string;
      username?: string;
      password?: string;
      role: string;
      agency: string;
      active: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    if (me.role !== "admin") throw new Error("Only an administrator can add or edit staff.");
    const name = data.name.trim();
    if (!name) throw new Error("Enter the staff name.");
    const role = ["admin", "manager", "negotiator"].includes(data.role) ? data.role : "negotiator";
    const agency = data.agency === "gr" ? "gr" : "al";
    const username = (data.username ?? "").trim().toLowerCase();
    const password = data.password ?? "";
    const sql = await ensureStaffLoginColumns();
    if (username) {
      staffLoginEmail(username);
      const taken = await sql<Row>`
        select id from staff where lower(username) = ${username} and id <> ${data.id ?? 0} limit 1
      `;
      if (taken[0]) throw new Error("That username is already in use.");
    }
    if (data.id) {
      const current = await sql<Row>`select * from staff where id = ${data.id}`;
      if (!current[0]) throw new Error("Staff member not found");
      let userId = text(current[0].user_id);
      if (username && password) {
        userId = await createCredentialUser(name, username, password);
      } else if (username && !userId) {
        throw new Error("Set a password the first time you give someone a username.");
      }
      await sql`
        update staff set name = ${name}, email = ${data.email ?? ""}, username = ${username || text(current[0].username)},
          role = ${role}, agency = ${agency}, active = ${data.active},
          user_id = ${userId || null},
          must_change_password = ${password ? true : current[0].must_change_password === true}
        where id = ${data.id}
      `;
      return { id: data.id };
    }
    if (!username || password.length < 8) throw new Error("Enter a username and a password of at least 8 characters.");
    const userId = await createCredentialUser(name, username, password);
    const inserted = await sql<{ id: number }>`
      insert into staff (user_id, name, email, username, role, agency, active, must_change_password)
      values (${userId}, ${name}, ${data.email ?? ""}, ${username}, ${role}, ${agency}, ${data.active}, true)
      returning id
    `;
    return { id: num(inserted[0]?.id) };
  });

export const changeOwnPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { currentPassword: string; nextPassword: string }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    if (data.nextPassword.length < 8) throw new Error("Use at least 8 characters.");
    const sql = await db();
    const accounts = await sql<{ id: string; password: string }>`
      select "id" as id, "password" as password from "account"
      where "userId" = ${context.userId} and "providerId" = 'credential' limit 1
    `;
    const account = accounts[0];
    if (!account?.password) throw new Error("This login has no password yet.");
    const matches = await verifyPassword({ hash: account.password, password: data.currentPassword });
    if (!matches) throw new Error("The current password is not right.");
    await upsertCredential(context.userId, data.nextPassword);
    await sql`update staff set must_change_password = false where id = ${me.id}`;
    return { ok: true };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number; password: string }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    if (me.role !== "admin") throw new Error("Only an administrator can reset a password.");
    if (data.password.length < 8) throw new Error("Use at least 8 characters.");
    const sql = await ensureStaffLoginColumns();
    const rows = await sql<Row>`select * from staff where id = ${data.id} limit 1`;
    const person = rows[0];
    if (!person) throw new Error("Staff member not found");
    const username = text(person.username);
    if (!username) throw new Error("This person has no username yet. Add one on the Staff page first.");
    const userId = await createCredentialUser(text(person.name), username, data.password);
    await sql`
      update staff set user_id = ${userId}, must_change_password = true where id = ${data.id}
    `;
    return { ok: true, name: text(person.name) };
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureMe(context.userId);
    const sql = await ensureGmailMailbox();
    const rows = await sql<Row>`select * from mailboxes order by agency`;
    return rows.map((row) => ({
      agency: text(row.agency),
      fromAddress: text(row.from_address),
      fromName: text(row.from_name),
      tenantId: text(row.tenant_id),
      clientId: text(row.client_id),
      hasSecret: Boolean(text(row.client_secret)),
      live: row.live === true,
      kind: text(row.kind) || "graph",
    }));
  });

export const saveMailbox = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: { agency: string; fromAddress: string; tenantId: string; clientId: string; clientSecret: string; live: boolean }) => data,
  )
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    assertManager(me.role);
    if (data.agency !== "al" && data.agency !== "gr") throw new Error("Choose Andrew Lees or Gibbins Richards.");
    const fromAddress = data.fromAddress.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) throw new Error("Enter a valid email address for this branch.");
    const sql = await db();
    const current = await sql<Row>`select client_secret from mailboxes where agency = ${data.agency}`;
    const nextSecret =
      data.clientSecret && !data.clientSecret.startsWith("•")
        ? data.clientSecret.trim()
        : text(current[0]?.client_secret);
    await sql`
      update mailboxes set from_address = ${fromAddress}, tenant_id = ${data.tenantId.trim()}, client_id = ${data.clientId.trim()},
        client_secret = ${nextSecret}, live = ${Boolean(data.live && nextSecret && data.tenantId && data.clientId)}
      where agency = ${data.agency}
    `;
    return { ok: true };
  });

export const saveGmailTrial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { address: string; appPassword: string; live: boolean }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    assertManager(me.role);
    const address = data.address.trim();
    if (address && !/^[^\s@]+@gmail\.com$/i.test(address) && !/^[^\s@]+@googlemail\.com$/i.test(address)) {
      throw new Error("Use a Gmail address, such as name@gmail.com.");
    }
    const sql = await ensureGmailMailbox();
    const current = await sql<Row>`select client_secret from mailboxes where agency = 'gmail'`;
    const nextSecret = data.appPassword.trim()
      ? data.appPassword.replace(/\s+/g, "")
      : text(current[0]?.client_secret);
    const live = Boolean(data.live && address && nextSecret);
    await sql`
      update mailboxes set from_address = ${address}, client_secret = ${nextSecret}, live = ${live}, kind = 'smtp'
      where agency = 'gmail'
    `;
    return { ok: true, live };
  });

export const sendGmailTest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { address: string; appPassword: string }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    assertManager(me.role);
    const sql = await ensureGmailMailbox();
    const current = await sql<Row>`select client_secret from mailboxes where agency = 'gmail'`;
    const password = data.appPassword.trim()
      ? data.appPassword.replace(/\s+/g, "")
      : text(current[0]?.client_secret);
    const address = data.address.trim();
    await sendViaGmail(
      address,
      password,
      [address],
      "Feedy Gmail trial",
      `This is a test from Feedy, sent by ${me.name}. Landlord feedback can leave from this Gmail while the trial is switched on.`,
    );
    return { ok: true };
  });

function branchAgency(value: string): "al" | "gr" | "" {
  if (value === "gr") return "gr";
  if (value === "al") return "al";
  return "";
}

function isGmailAddress(value: string): boolean {
  return /^[^\s@]+@(gmail|googlemail)\.com$/i.test(value.trim());
}

export const saveBranchGmail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { agency: string; address: string; appPassword: string; live: boolean }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    assertManager(me.role);
    const agency = branchAgency(data.agency);
    if (!agency) throw new Error("Choose Andrew Lees or Gibbins Richards.");
    const address = data.address.trim();
    if (!isGmailAddress(address)) throw new Error("Use the Gmail address for this branch, such as name@gmail.com.");
    const sql = await ensureGmailMailbox();
    const current = await sql<Row>`select client_secret, kind from mailboxes where agency = ${agency}`;
    const saved = text(current[0]?.kind) === "smtp" ? text(current[0]?.client_secret) : "";
    const nextSecret = data.appPassword.trim() ? data.appPassword.replace(/\s+/g, "") : saved;
    if (!nextSecret) throw new Error("Paste the 16-character app password from that Gmail account.");
    const live = Boolean(data.live && nextSecret);
    await sql`
      update mailboxes set from_address = ${address}, client_secret = ${nextSecret}, live = ${live}, kind = 'smtp',
        from_name = ${agency === "gr" ? "Gibbins Richards Lettings" : "Andrew Lees Lettings"}
      where agency = ${agency}
    `;
    return { ok: true, live };
  });

export const sendBranchGmailTest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { agency: string; address: string; appPassword: string }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    assertManager(me.role);
    const agency = branchAgency(data.agency);
    if (!agency) throw new Error("Choose a branch.");
    const address = data.address.trim();
    if (!isGmailAddress(address)) throw new Error("Use the Gmail address for this branch, such as name@gmail.com.");
    const sql = await ensureGmailMailbox();
    const current = await sql<Row>`select client_secret, kind from mailboxes where agency = ${agency}`;
    const saved = text(current[0]?.kind) === "smtp" ? text(current[0]?.client_secret) : "";
    const password = data.appPassword.trim() ? data.appPassword.replace(/\s+/g, "") : saved;
    await sendViaGmail(
      address,
      password,
      [address],
      `Feedy test · ${agency === "gr" ? "Gibbins Richards" : "Andrew Lees"}`,
      `This is a test from Feedy, sent by ${me.name}. Feedback for this branch will leave from this Gmail address.`,
    );
    return { ok: true };
  });

export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { viewingId: number; agency: string; to: string; subject: string; body: string }) => data)
  .handler(async ({ data, context }) => {
    const me = await ensureMe(context.userId);
    const sql = await ensureGmailMailbox();
    const viewings = await sql<Row>`select property_id, interest from viewings where id = ${data.viewingId}`;
    if (!viewings[0]) throw new Error("Viewing not found");
    const agency = data.agency === "gr" ? "gr" : "al";
    const mailbox = await sql<Row>`select * from mailboxes where agency = ${agency}`;
    const gmail = await sql<Row>`select * from mailboxes where agency = 'gmail'`;
    const branchAddress = text(mailbox[0]?.from_address);
    const branchSecret = text(mailbox[0]?.client_secret);
    const branchGmail = text(mailbox[0]?.kind) === "smtp" && mailbox[0]?.live === true && Boolean(branchAddress) && Boolean(branchSecret);
    const gmailAddress = text(gmail[0]?.from_address);
    const gmailSecret = text(gmail[0]?.client_secret);
    const gmailLive = gmail[0]?.live === true && Boolean(gmailAddress) && Boolean(gmailSecret);
    const graphLive = mailbox[0]?.live === true && text(mailbox[0]?.kind) !== "smtp" && text(mailbox[0]?.tenant_id) && text(mailbox[0]?.client_id) && Boolean(branchSecret);
    let from = branchGmail ? branchAddress : gmailLive ? gmailAddress : branchAddress || agencyEmail(agency);
    const recipients = data.to
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!recipients.length) throw new Error("Enter the landlord email address.");
    let status = "not_sent";
    let error = "";
    if (branchGmail && mailbox[0]) {
      try {
        await sendViaGmail(branchAddress, branchSecret, recipients, data.subject, data.body);
        status = "sent";
        from = branchAddress;
      } catch (err) {
        error = err instanceof Error ? err.message : "Gmail did not send the email.";
      }
    } else if (graphLive && mailbox[0]) {
      try {
        await graphSend(
          {
            tenant: text(mailbox[0].tenant_id),
            client: text(mailbox[0].client_id),
            secret: branchSecret,
            from,
          },
          recipients,
          data.subject,
          data.body,
        );
        status = "sent";
      } catch (err) {
        error = err instanceof Error ? err.message : "Microsoft did not send the email.";
      }
    } else if (gmailLive) {
      try {
        await sendViaGmail(gmailAddress, gmailSecret, recipients, data.subject, data.body);
        status = "sent";
        from = gmailAddress;
      } catch (err) {
        error = err instanceof Error ? err.message : "Gmail did not send the email.";
      }
    } else {
      error = "Add this branch's Gmail address in Settings and tick send from this Gmail. The email was kept here and was not sent.";
    }
    await sql`
      insert into emails (viewing_id, sent_by, from_address, to_address, subject, body, agency, status, error)
      values (
        ${data.viewingId}, ${me.id}, ${from}, ${recipients.join(", ")}, ${data.subject}, ${data.body}, ${agency}, ${status}, ${error}
      )
    `;
    if (status === "sent") {
      const chasing = text(viewings[0].interest) === "no_feedback";
      if (!chasing) {
        await sql`update viewings set feedback_status = 'sent' where id = ${data.viewingId}`;
      }
      await logActivity(
        num(viewings[0].property_id),
        chasing ? "Landlord told there is no feedback yet" : "Feedback emailed to landlord",
        recipients.join(", "),
        me.name,
        data.viewingId,
      );
    }
    return { sent: status === "sent", error, from };
  });

async function graphSend(
  mailbox: { tenant: string; client: string; secret: string; from: string },
  to: string[],
  subject: string,
  body: string,
) {
  const tokenRes = await fetch(`https://login.microsoftonline.com/${mailbox.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: mailbox.client,
      client_secret: mailbox.secret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Microsoft sign-in failed (${tokenRes.status}). Check the tenant, app id and secret.`);
  const token = (await tokenRes.json()) as { access_token?: string };
  const send = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox.from)}/sendMail`, {
    method: "POST",
    headers: { authorization: `Bearer ${token.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "Text", content: body },
        toRecipients: to.map((address) => ({ emailAddress: { address } })),
      },
      saveToSentItems: true,
    }),
  });
  if (!send.ok) {
    const detail = (await send.text()).slice(0, 220);
    throw new Error(detail || `Microsoft refused the email (${send.status}).`);
  }
}

export const getReports = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { agency?: string; from?: string; to?: string }) => data ?? {})
  .handler(async ({ data, context }) => {
    await ensureMe(context.userId);
    const sql = await db();
    const agency = data.agency === "al" || data.agency === "gr" ? data.agency : "";
    const params: unknown[] = [];
    const bits = ["true"];
    if (agency) {
      params.push(agency);
      bits.push(`p.agency = $${params.length}`);
    }
    if (data.from) {
      params.push(data.from);
      bits.push(`v.viewed_on >= $${params.length}`);
    }
    if (data.to) {
      params.push(data.to);
      bits.push(`v.viewed_on <= $${params.length}`);
    }
    const where = bits.join(" and ");
    const byProperty = await sql.query<Row>(
      `select p.address, p.status, count(*)::int as viewings,
        count(*) filter (where v.feedback_status in ${DONE})::int as done
       from viewings v join properties p on p.id = v.property_id
       where ${where} group by p.id, p.address, p.status order by viewings desc limit 30`,
      params,
    );
    const byStaff = await staffStats(agency);
    const reasons = await sql.query<Row>(
      `select v.feedback_json from viewings v join properties p on p.id = v.property_id
       where ${where} and v.interest = 'not_interested'`,
      params,
    );
    const counts = new Map<string, number>();
    for (const row of reasons) {
      const fields = safeJson(text(row.feedback_json));
      const reason = fields.reasons || fields.viewerFeedback || "";
      for (const part of reason.split(/[;\n]/).map((item) => item.trim()).filter((item) => item.length > 2)) {
        counts.set(part, (counts.get(part) ?? 0) + 1);
      }
    }
    const hot = await sql.query<Row>(
      `select p.address, count(*)::int as viewings from viewings v
       join properties p on p.id = v.property_id
       where ${where} and p.status = 'available'
       group by p.id, p.address having count(*) >= 1
       order by viewings desc limit 10`,
      params,
    );
    const interested = await sql.query<Row>(
      `select p.address, v.viewer_name, v.viewed_on, v.interest from viewings v
       join properties p on p.id = v.property_id
       where ${where} and (v.interest in ('interested','very_interested') or v.feedback_status = 'interested')
       order by v.viewed_on desc limit 30`,
      params,
    );
    const scored = await sql.query<Row>(
      `select count(*)::int as viewings,
        count(*) filter (where v.feedback_status in ${DONE})::int as done
       from viewings v join properties p on p.id = v.property_id
       where ${where} and v.viewed_on < current_date`,
      params,
    );
    const total = num(scored[0]?.viewings);
    const done = num(scored[0]?.done);
    const allViewings = byProperty.reduce((sum, row) => sum + num(row.viewings), 0);
    return {
      byProperty: byProperty.map((row) => ({
        address: text(row.address),
        status: text(row.status),
        viewings: num(row.viewings),
        done: num(row.done),
      })),
      staff: byStaff,
      reasons: [...counts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 8),
      stillAvailable: hot.map((row) => ({ address: text(row.address), viewings: num(row.viewings) })),
      interested: interested.map((row) => ({
        address: text(row.address),
        viewer: text(row.viewer_name),
        date: dateText(row.viewed_on) ?? "",
        interest: text(row.interest),
      })),
      percent: total ? Math.round((done / total) * 100) : 100,
      viewings: allViewings,
    };
  });

function londonGreeting(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/London" }).format(now),
  );
  return hour < 12 ? "Good morning" : "Good afternoon";
}

function officePhone(agency: string): string {
  return agency === "gr" ? "01823 325 250" : "01278 418 001";
}

export function emailDraft(input: {
  landlord: string;
  address: string;
  when: string;
  feedback: string;
  interest: string;
  negotiator: string;
  agency: string;
  noFeedback?: boolean;
}) {
  const close = `Please do not reply to this email, as this inbox is not monitored. If you have any further questions, please call our office on ${officePhone(input.agency)}.

Kind regards,
${input.negotiator}
${agencyName(input.agency)}`;
  const where = `Following the viewing at ${input.address}${input.when ? ` on ${input.when}` : ""}`;
  const comments = viewerComments(input.feedback);
  const given = comments ? `\n\nFeedback given:\n${comments}` : "";
  const outcome = input.noFeedback || input.interest === "no_feedback" ? "no_feedback" : input.interest === "not_interested" ? "not_interested" : "interested";
  if (outcome === "no_feedback") {
    return `${londonGreeting()},

${where}, feedback was not given at the viewing. We will continue to chase this and be in touch.${given}

${close}`;
  }
  if (outcome === "not_interested") {
    return `${londonGreeting()},

${where}, unfortunately the applicant is not interested in the property. We will continue booking further viewings.${given}

${close}`;
  }
  return `${londonGreeting()},

${where}, the applicant is interested in the property and has been sent an application form to fill out. Once we have received it, we will send it over to you for review.${given}

${close}`;
}

const CANNED_FEEDBACK = new Set([
  "The applicant is interested in the property and has been sent an application form to fill out. We will send this over once it is received.",
  "Unfortunately the applicant is not interested in the property. We will continue booking further viewings.",
  "Feedback was not given at the viewing. We will continue to chase this and be in touch.",
  "The applicant did not want to give feedback on the viewing. We will re-chase this and try to get the feedback.",
]);

function viewerComments(feedback: string): string {
  const text = feedback.trim();
  if (!text || CANNED_FEEDBACK.has(text)) return "";
  return text;
}
