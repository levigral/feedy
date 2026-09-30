import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { a as env, c as hashPassword$1, i as authMiddleware, l as isFeedbackComplete, n as agencyEmail, p as verifyPassword$1 } from "./labels-DDHELNR_.mjs";
import { i as isViewingEvent, l as reviewDiaryRow, t as addressKey, u as splitPostcode } from "./diary-CEGBpdpO.mjs";
import { randomUUID } from "node:crypto";
import { connect } from "node:net";
import { connect as connect$1 } from "node:tls";
//#region node_modules/.nitro/vite/services/ssr/assets/office-D-b8GL3Y.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var Smtp = class {
	socket;
	buffer = "";
	pending = [];
	constructor(socket) {
		this.socket = socket;
		socket.setEncoding("utf8");
		socket.on("data", (chunk) => {
			this.buffer += chunk;
			this.pending.splice(0).forEach((wake) => wake());
		});
	}
	read() {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Gmail did not reply in time.")), 2e4);
			const pull = () => {
				const lines = this.buffer.split(/\r\n/);
				if (!this.buffer.endsWith("\r\n")) lines.pop();
				const end = lines.findIndex((line) => /^\d{3} /.test(line));
				if (end < 0) {
					this.pending.push(pull);
					return;
				}
				clearTimeout(timer);
				const reply = lines.slice(0, end + 1).join("\r\n");
				this.buffer = this.buffer.slice(reply.length + 2);
				if (Number(reply.slice(0, 3)) >= 400) reject(new Error(reply.replace(/\s+/g, " ").slice(0, 240)));
				else resolve(reply);
			};
			pull();
		});
	}
	async cmd(line) {
		this.socket.write(`${line}\r\n`);
		return this.read();
	}
};
function waitFor(socket, event) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Could not reach Gmail.")), 2e4);
		socket.once(event, () => {
			clearTimeout(timer);
			resolve();
		});
		socket.once("error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
async function sendViaGmail(from, password, to, subject, body) {
	const sender = from.trim();
	const recipients = to.map((item) => item.trim()).filter(Boolean);
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)) throw new Error("Enter a Gmail address.");
	if (!password.trim()) throw new Error("Paste a Gmail app password.");
	if (!recipients.length || recipients.some((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) throw new Error("Enter a valid landlord email address.");
	const plain = connect({
		host: "smtp.gmail.com",
		port: 587
	});
	await waitFor(plain, "connect");
	let smtp = new Smtp(plain);
	await smtp.read();
	await smtp.cmd("EHLO viewingdesk");
	await smtp.cmd("STARTTLS");
	plain.removeAllListeners("data");
	const secure = connect$1({
		socket: plain,
		servername: "smtp.gmail.com"
	});
	await waitFor(secure, "secureConnect");
	smtp = new Smtp(secure);
	await smtp.cmd("EHLO viewingdesk");
	await smtp.cmd("AUTH LOGIN");
	await smtp.cmd(Buffer.from(sender).toString("base64"));
	await smtp.cmd(Buffer.from(password.replace(/\s+/g, "")).toString("base64"));
	await smtp.cmd(`MAIL FROM:<${sender}>`);
	for (const recipient of recipients) await smtp.cmd(`RCPT TO:<${recipient}>`);
	await smtp.cmd("DATA");
	const message = [
		`From: ${sender}`,
		`To: ${recipients.join(", ")}`,
		`Subject: ${subject.replace(/[\r\n]+/g, " ").slice(0, 180)}`,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=utf-8",
		"",
		body.replace(/\r?\n/g, "\r\n").replace(/^\./gm, ".."),
		"."
	].join("\r\n");
	secure.write(`${message}\r\n`);
	await smtp.read();
	await smtp.cmd("QUIT").catch(() => void 0);
	secure.end();
}
function staffLoginEmail(username) {
	const clean = username.trim().toLowerCase();
	if (!clean) throw new Error("Enter a username.");
	if (clean.includes("@")) return clean;
	const local = clean.replace(/[^a-z0-9._-]/g, "");
	if (local.length < 3) throw new Error("Usernames need at least 3 letters or numbers.");
	return `${local}@staff.viewingdesk.app`;
}
/** Usernames and emails that should match one login, including a short name like "levi". */
function loginEmailCandidates(username) {
	const clean = username.trim().toLowerCase();
	if (!clean) return [];
	const local = clean.split("@")[0].replace(/[^a-z0-9._-]/g, "");
	const values = [clean];
	if (local) values.push(local, `${local}@staff.viewingdesk.app`, `${local}@gralgroup.co.uk`);
	try {
		values.push(staffLoginEmail(clean));
	} catch {}
	return [...new Set(values)];
}
async function db() {
	const { getSql } = await import("./db-DSIHbxVo.mjs").then((n) => n.t).then((n) => n.t);
	const sql = await getSql();
	await sql`alter table properties add column if not exists landlord_name_2 text not null default ''`;
	return sql;
}
function num(value) {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}
function text(value) {
	return value == null ? "" : String(value);
}
function dateText(value) {
	const raw = text(value);
	return raw ? raw.slice(0, 10) : null;
}
function mapStaff(row) {
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
		lets: num(row.lets),
		avgDays: row.avg_days == null || row.avg_days === "" ? null : Math.round(num(row.avg_days))
	};
}
function mapProperty(row) {
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
		firstViewing: dateText(row.first_viewing)
	};
}
function mapViewing(row) {
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
		applicationStatus: text(row.application_status)
	};
}
function safeJson(raw) {
	try {
		const parsed = JSON.parse(raw || "{}");
		return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, text(value)]));
	} catch {
		return {};
	}
}
function norm(value) {
	return value.toLowerCase().replace(/[^a-z]/g, "");
}
function namesMatch(left, right) {
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
function keysMatch(left, right) {
	if (!left || !right) return false;
	if (left === right) return true;
	const shorter = left.length < right.length ? left : right;
	const longer = left.length < right.length ? right : left;
	return shorter.length >= 8 && longer.startsWith(shorter);
}
function titleName(value) {
	return value.trim().replace(/\s+/g, " ").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
async function ensureMe(userId) {
	const sql = await ensureStaffLoginColumns();
	const users = await sql`
    select "name" as name, "email" as email from "user" where "id" = ${userId} limit 1
  `;
	const name = users[0]?.name?.trim() || "Staff";
	const email = users[0]?.email?.trim() || "";
	const linked = await sql`select * from staff where user_id = ${userId} limit 1`;
	if (linked[0]) {
		if ((text(linked[0].username).toLowerCase() === ADMIN_USERNAME || email.toLowerCase() === ADMIN_USERNAME) && text(linked[0].name) !== "Levi Holland") {
			const updated = await sql`update staff set name = 'Levi Holland' where id = ${num(linked[0].id)} returning *`;
			await sql`update "user" set "name" = 'Levi Holland', "updatedAt" = now() where "id" = ${userId}`;
			return mapStaff(updated[0] ?? linked[0]);
		}
		return mapStaff(linked[0]);
	}
	if (email) {
		const byEmail = await sql`
      select * from staff where user_id is null and lower(email) = lower(${email}) limit 1
    `;
		if (byEmail[0]) return mapStaff((await sql`
        update staff set user_id = ${userId} where id = ${num(byEmail[0].id)} returning *
      `)[0] ?? byEmail[0]);
	}
	const named = (await sql`select * from staff`).find((row) => !row.user_id && norm(text(row.name)) === norm(name));
	if (named) return mapStaff((await sql`
      update staff set user_id = ${userId}, email = case when email = '' then ${email} else email end
      where id = ${num(named.id)} returning *
    `)[0] ?? named);
	return mapStaff((await sql`
    insert into staff (user_id, name, email, role, agency)
    values (${userId}, ${name}, ${email}, ${num((await sql`select count(*)::int as n from staff where user_id is not null`)[0]?.n) === 0 ? "admin" : "negotiator"}, 'al')
    returning *
  `)[0] ?? {});
}
function assertManager(role) {
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
var ADMIN_USERNAME = "levi@gralgroup.co.uk";
var ADMIN_PASSWORD = "Lettings123!";
async function upsertCredential(userId, password) {
	const sql = await db();
	const hash = await hashPassword$1(password);
	const existing = await sql`
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
async function createCredentialUser(name, username, password) {
	const sql = await db();
	const email = staffLoginEmail(username);
	const found = await sql`select "id" as id from "user" where lower("email") = lower(${email}) limit 1`;
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
var prepareSignIn_createServerFn_handler = createServerRpc({
	id: "8d29326e646abc4ff1ea14a838f3778f7e7e92c64e9c374214a4862056066a09",
	name: "prepareSignIn",
	filename: "src/lib/office.ts"
}, (opts) => prepareSignIn.__executeServer(opts));
var prepareSignIn = createServerFn({ method: "GET" }).handler(prepareSignIn_createServerFn_handler, async () => {
	await ensureOwnerLogin();
	return { username: ADMIN_USERNAME };
});
async function ensureOwnerLogin() {
	const sql = await ensureStaffLoginColumns();
	const existing = await sql`select id, user_id, name from staff where lower(username) = ${ADMIN_USERNAME} limit 1`;
	const password = env("ADMIN_INITIAL_PASSWORD") || ADMIN_PASSWORD;
	const email = staffLoginEmail(ADMIN_USERNAME);
	let userId = (await sql`select "id" as id from "user" where lower("email") = lower(${email}) limit 1`)[0]?.id ?? "";
	if (!userId) userId = await createCredentialUser("Levi Holland", ADMIN_USERNAME, password);
	else {
		if (!(await sql`
      select "password" as password from "account" where "userId" = ${userId} and "providerId" = 'credential' limit 1
    `)[0]?.password) await upsertCredential(userId, password);
		await sql`update "user" set "name" = 'Levi Holland', "emailVerified" = true, "updatedAt" = now() where "id" = ${userId}`;
	}
	if (existing[0]) await sql`
      update staff set user_id = ${userId}, name = 'Levi Holland', email = ${email},
        username = ${ADMIN_USERNAME}, role = 'admin', active = true, must_change_password = false
      where id = ${num(existing[0].id)}
    `;
	else await sql`
      insert into staff (user_id, name, email, username, role, agency, active, must_change_password)
      values (${userId}, 'Levi Holland', ${email}, ${ADMIN_USERNAME}, 'admin', 'al', true, false)
    `;
	return userId;
}
/** Map whatever was typed (username or email) to the login email Better Auth stores. */
var resolveLogin_createServerFn_handler = createServerRpc({
	id: "fa5ca405739130f44b40fdeb653c103b9aef6c989f3b64221e54ca601100ff6e",
	name: "resolveLogin",
	filename: "src/lib/office.ts"
}, (opts) => resolveLogin.__executeServer(opts));
var resolveLogin = createServerFn({ method: "POST" }).validator((data) => data).handler(resolveLogin_createServerFn_handler, async ({ data }) => {
	await ensureOwnerLogin();
	const sql = await ensureStaffLoginColumns();
	const wanted = new Set(loginEmailCandidates(data.username ?? ""));
	if (wanted.size === 0) throw new Error("Enter a username.");
	const match = (await sql`select email, username, active from staff`).find((row) => {
		const username = text(row.username).toLowerCase();
		const email = text(row.email).toLowerCase();
		return wanted.has(username) || wanted.has(email) || wanted.has(username.split("@")[0]);
	});
	if (match && match.active === false) throw new Error("This login has been switched off. Ask Levi to turn it back on.");
	return { email: match ? staffLoginEmail(text(match.username) || text(match.email)) : staffLoginEmail(data.username) };
});
async function logActivity(propertyId, kind, detail, actor, viewingId) {
	await (await db())`
    insert into activity (property_id, viewing_id, kind, detail, actor)
    values (${propertyId}, ${viewingId ?? null}, ${kind}, ${detail}, ${actor})
  `;
}
var DONE = `('sent')`;
var getMe_createServerFn_handler = createServerRpc({
	id: "7671403ad0962b351a811b94149f985bc9d3180d1c0aa93e9a10c498cfc2b793",
	name: "getMe",
	filename: "src/lib/office.ts"
}, (opts) => getMe.__executeServer(opts));
var getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMe_createServerFn_handler, async ({ context }) => ensureMe(context.userId));
var getBoard_createServerFn_handler = createServerRpc({
	id: "bd168c26832bb285b623842f4f8eb4ef0fc87c53e5567f4f960511cbfb14f10b",
	name: "getBoard",
	filename: "src/lib/office.ts"
}, (opts) => getBoard.__executeServer(opts));
var getBoard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data ?? {}).handler(getBoard_createServerFn_handler, async ({ data, context }) => {
	await ensureMe(context.userId);
	const sql = await ensureApplicationColumn();
	const agency = data.agency === "al" || data.agency === "gr" ? data.agency : "";
	const negotiatorId = data.negotiatorId ? num(data.negotiatorId) : 0;
	const range = data.range === "today" || data.range === "week" || data.range === "month" ? data.range : "all";
	const filters = ["true"];
	const params = [];
	if (agency) {
		params.push(agency);
		filters.push(`p.agency = $${params.length}`);
	}
	if (negotiatorId) {
		params.push(negotiatorId);
		filters.push(`v.negotiator_id = $${params.length}`);
	}
	const rangeSql = range === "today" ? "and v.viewed_on = current_date" : range === "week" ? "and v.viewed_on >= date_trunc('week', current_date)::date" : range === "month" ? "and v.viewed_on >= date_trunc('month', current_date)::date" : "";
	const where = filters.join(" and ");
	const totals = await sql.query(`select count(*)::int as viewings,
        count(*) filter (where v.feedback_status in ${DONE})::int as done,
        count(*) filter (where v.interest in ('interested','very_interested') or v.feedback_status = 'interested')::int as interested
       from viewings v join properties p on p.id = v.property_id
       where ${where} ${rangeSql}`, params);
	const active = await sql.query(`select count(*)::int as n from properties p where p.status = 'available' ${agency ? "and p.agency = $1" : ""}`, agency ? [agency] : []);
	const outstanding = await sql.query(`select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
       from viewings v
       join properties p on p.id = v.property_id
       left join staff s on s.id = v.negotiator_id
       where v.feedback_status not in ${DONE} ${agency ? "and p.agency = $1" : ""} ${negotiatorId ? `and v.negotiator_id = $${agency ? 2 : 1}` : ""}
       order by v.viewed_on asc, v.viewed_at asc`, [...agency ? [agency] : [], ...negotiatorId ? [negotiatorId] : []]);
	const matched = (await sql.query(`select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
       from viewings v
       join properties p on p.id = v.property_id
       left join staff s on s.id = v.negotiator_id
       where ${where} ${rangeSql}
       order by v.viewed_on desc, v.viewed_at desc`, params)).map(mapViewing);
	const keenRows = await sql.query(`select v.*, p.address, p.postcode, p.agency, p.status as property_status, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
       from viewings v
       join properties p on p.id = v.property_id
       left join staff s on s.id = v.negotiator_id
       where ${where} and v.interest in ('interested', 'very_interested')
       order by v.viewed_on desc, v.viewed_at desc`, params);
	const followUps = keenRows.map(mapViewing).filter((row) => row.applicationStatus !== "across");
	const applications = keenRows.filter((row) => text(row.application_status) === "across" && text(row.property_status) !== "let_agreed").map(mapViewing);
	const staff = await staffStats(agency);
	const viewings = num(totals[0]?.viewings);
	const done = num(totals[0]?.done);
	return {
		activeProperties: num(active[0]?.n),
		viewings,
		done,
		outstanding: viewings - done,
		percent: viewings ? Math.round(done / viewings * 100) : 0,
		interested: followUps.length,
		applications: applications.length,
		attention: outstanding.length,
		queue: outstanding.map(mapViewing),
		matched,
		doneQueue: matched.filter((row) => isFeedbackComplete(row.status)),
		interestedQueue: followUps,
		applicationQueue: applications,
		staff
	};
});
async function staffStats(agency) {
	return (await (await db()).query(`select s.*,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id ${agency ? "and p.agency = $1" : ""}) as viewings,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id and v.feedback_status in ${DONE} ${agency ? "and p.agency = $1" : ""}) as done,
      (select count(*)::int from viewings v join properties p on p.id = v.property_id
        where v.negotiator_id = s.id and v.feedback_status not in ${DONE} ${agency ? "and p.agency = $1" : ""}) as outstanding,
      (select count(*)::int from properties p where p.let_agreed_by = s.id ${agency ? "and p.agency = $1" : ""}) as lets,
      (select avg((p.let_agreed_on - (select min(v.viewed_on) from viewings v where v.property_id = p.id)))
        from properties p where p.let_agreed_by = s.id and p.let_agreed_on is not null ${agency ? "and p.agency = $1" : ""}) as avg_days
     from staff s
     where s.active = true
     order by s.name`, agency ? [agency] : [])).map(mapStaff);
}
var listProperties_createServerFn_handler = createServerRpc({
	id: "ba122b7adc434d32af21ab8d4a33dfbfe85ab454e4d68b0851e625c2c2211b29",
	name: "listProperties",
	filename: "src/lib/office.ts"
}, (opts) => listProperties.__executeServer(opts));
var listProperties = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listProperties_createServerFn_handler, async ({ context }) => {
	await ensureMe(context.userId);
	return (await (await db())`
      select p.*, s.name as negotiator_name, g.name as let_agreed_by_name,
        (select count(*)::int from viewings v where v.property_id = p.id) as viewing_count,
        (select count(*)::int from viewings v where v.property_id = p.id and v.feedback_status = 'sent') as feedback_done,
        (select min(v.viewed_on) from viewings v where v.property_id = p.id) as first_viewing
      from properties p
      left join staff s on s.id = p.negotiator_id
      left join staff g on g.id = p.let_agreed_by
      order by p.address
    `).map(mapProperty);
});
var getProperty_createServerFn_handler = createServerRpc({
	id: "b3abc658381b8a2655c7e0ad71692bcda5a05daaf22e079e70f30dafbf36c7b8",
	name: "getProperty",
	filename: "src/lib/office.ts"
}, (opts) => getProperty.__executeServer(opts));
var getProperty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(getProperty_createServerFn_handler, async ({ data, context }) => {
	await ensureMe(context.userId);
	const sql = await db();
	const id = num(data.id);
	const rows = await sql`
      select p.*, s.name as negotiator_name, g.name as let_agreed_by_name,
        (select count(*)::int from viewings v where v.property_id = p.id) as viewing_count,
        (select count(*)::int from viewings v where v.property_id = p.id and v.feedback_status = 'sent') as feedback_done,
        (select min(v.viewed_on) from viewings v where v.property_id = p.id) as first_viewing
      from properties p
      left join staff s on s.id = p.negotiator_id
      left join staff g on g.id = p.let_agreed_by
      where p.id = ${id}
    `;
	if (!rows[0]) throw new Error("Property not found");
	const viewings = await sql`
      select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2, p.landlord_phone,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
      from viewings v
      join properties p on p.id = v.property_id
      left join staff s on s.id = v.negotiator_id
      where v.property_id = ${id}
      order by v.viewed_on desc, v.viewed_at desc
    `;
	const activity = await sql`
      select kind, detail, actor, created_at from activity where property_id = ${id} order by created_at desc limit 40
    `;
	const emails = await sql`
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
			at: text(row.created_at)
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
			sentAt: text(row.sent_at)
		}))
	};
});
var saveProperty_createServerFn_handler = createServerRpc({
	id: "2add3df0539fd084f6dd9c35c2990cd6c35fcf70da9613f18304b49188cb7358",
	name: "saveProperty",
	filename: "src/lib/office.ts"
}, (opts) => saveProperty.__executeServer(opts));
var saveProperty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveProperty_createServerFn_handler, async ({ data, context }) => {
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
		await sql.query(`update properties set address=$1, address_key=$2, postcode=$3, agency=$4, rent=$5,
          landlord_name=$6, landlord_email=$7, landlord_phone=$8, landlord_email_2=$9, landlord_name_2=$10, status=$11,
          marketed_on=$12, negotiator_id=$13, notes=$14 where id=$15`, [
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
			data.id
		]);
		await logActivity(data.id, "Property updated", address, me.name);
		return { id: data.id };
	}
	const id = num((await sql`
      insert into properties (
        address, address_key, postcode, agency, rent, landlord_name, landlord_email, landlord_phone,
        landlord_email_2, landlord_name_2, status, marketed_on, negotiator_id, notes
      ) values (
        ${address}, ${key}, ${postcode}, ${agency}, ${data.rent ?? ""}, ${data.landlordName ?? ""},
        ${data.landlordEmail ?? ""}, ${data.landlordPhone ?? ""}, ${data.landlordEmail2 ?? ""}, ${data.landlordName2 ?? ""},
        ${data.status || "available"}, ${marketed}, ${negotiator}, ${data.notes ?? ""}
      ) returning id
    `)[0]?.id);
	await logActivity(id, "Property added", address, me.name);
	return { id };
});
var saveLandlord_createServerFn_handler = createServerRpc({
	id: "5872cee24fcd4b69bb477c8ee4e6b58c4a0c3746f71057fc781c1768c411747e",
	name: "saveLandlord",
	filename: "src/lib/office.ts"
}, (opts) => saveLandlord.__executeServer(opts));
var saveLandlord = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveLandlord_createServerFn_handler, async ({ data, context }) => {
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
var setLetAgreed_createServerFn_handler = createServerRpc({
	id: "4033e886d774c190c8a1760c2898f14b3ba152f1e46d3e18cc45a380208d9cb7",
	name: "setLetAgreed",
	filename: "src/lib/office.ts"
}, (opts) => setLetAgreed.__executeServer(opts));
var setLetAgreed = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(setLetAgreed_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await db();
	if (data.revert) {
		await sql`update properties set status = 'available', let_agreed_on = null, let_agreed_by = null where id = ${data.id}`;
		await logActivity(data.id, "Back on the market", "Let agreed was cancelled", me.name);
		return { ok: true };
	}
	const on = data.on || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	await sql`
      update properties set status = 'let_agreed', let_agreed_on = ${on}, let_agreed_by = ${data.staffId}
      where id = ${data.id}
    `;
	await logActivity(data.id, "Let agreed", `Marked let agreed on ${on}`, me.name);
	return { ok: true };
});
var archiveProperty_createServerFn_handler = createServerRpc({
	id: "2726da936f8f59c1e2adb3ae81c891c219ad3c3f801b8bcf7458fc3fd0cb571e",
	name: "archiveProperty",
	filename: "src/lib/office.ts"
}, (opts) => archiveProperty.__executeServer(opts));
var archiveProperty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(archiveProperty_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	assertManager(me.role);
	const sql = await db();
	if (data.hard) {
		if (me.role !== "admin") throw new Error("Only an administrator can delete a property.");
		await sql`delete from properties where id = ${data.id}`;
		return { ok: true };
	}
	await sql`update properties set status = 'withdrawn' where id = ${data.id}`;
	await logActivity(data.id, "Withdrawn", "Property archived", me.name);
	return { ok: true };
});
var addViewing_createServerFn_handler = createServerRpc({
	id: "a86a5a17c8bd870616fa40726c11dbc5a5eca4fbe365530d15cea9d15319e2f9",
	name: "addViewing",
	filename: "src/lib/office.ts"
}, (opts) => addViewing.__executeServer(opts));
var addViewing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(addViewing_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	if (!data.date) throw new Error("Enter the viewing date.");
	const sql = await db();
	const status = data.immediate ? "received" : "awaiting";
	const inserted = await sql`
      insert into viewings (
        property_id, viewed_on, viewed_at, viewer_name, viewer_phone, viewer_email, negotiator_id, notes, feedback_status
      ) values (
        ${data.propertyId}, ${data.date}, ${data.time ?? ""}, ${data.viewerName ?? ""}, ${data.viewerPhone ?? ""},
        ${data.viewerEmail ?? ""}, ${data.negotiatorId || null}, ${data.notes ?? ""}, ${status}
      ) returning id
    `;
	await logActivity(data.propertyId, "Viewing booked", `${data.date} ${data.time} ${data.viewerName}`.trim(), me.name, num(inserted[0]?.id));
	return { id: num(inserted[0]?.id) };
});
var saveFeedback_createServerFn_handler = createServerRpc({
	id: "7720e7ee327b5c863988df24004991dae4a1a790ef09d9157bbfbbc542bcf58e",
	name: "saveFeedback",
	filename: "src/lib/office.ts"
}, (opts) => saveFeedback.__executeServer(opts));
var saveFeedback = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveFeedback_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await db();
	const current = await sql`select feedback_status, property_id from viewings where id = ${data.id}`;
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
var markContacted_createServerFn_handler = createServerRpc({
	id: "526df20b630dfe9a7bbb2d4bfa5669773e426c7c2ed9c8165337b4dcbbf3c036",
	name: "markContacted",
	filename: "src/lib/office.ts"
}, (opts) => markContacted.__executeServer(opts));
var markContacted = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(markContacted_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await db();
	const current = await sql`select feedback_status, property_id from viewings where id = ${data.id}`;
	if (!current[0]) throw new Error("Viewing not found");
	if (!isFeedbackComplete(text(current[0].feedback_status))) await sql`update viewings set feedback_status = 'requested' where id = ${data.id}`;
	await logActivity(num(current[0].property_id), "Feedback requested", "Applicant contacted", me.name, data.id);
	return { ok: true };
});
var markApplication_createServerFn_handler = createServerRpc({
	id: "6a39be271979d8787b7ec2547bca79649b0682ba37992a2bd32503ee4c02958a",
	name: "markApplication",
	filename: "src/lib/office.ts"
}, (opts) => markApplication.__executeServer(opts));
var markApplication = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(markApplication_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await ensureApplicationColumn();
	const current = await sql`select property_id, viewer_name from viewings where id = ${data.id}`;
	if (!current[0]) throw new Error("Viewing not found");
	await sql`update viewings set application_status = ${data.across ? "across" : ""} where id = ${data.id}`;
	await logActivity(num(current[0].property_id), data.across ? "Application sent to landlord" : "Application moved back", text(current[0].viewer_name) || "Viewer", me.name, data.id);
	return { ok: true };
});
var listViewings_createServerFn_handler = createServerRpc({
	id: "a4708e3a4bfb043d512297d219c798e960771a6b211be4b58e30c8eebb485022",
	name: "listViewings",
	filename: "src/lib/office.ts"
}, (opts) => listViewings.__executeServer(opts));
var listViewings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data ?? {}).handler(listViewings_createServerFn_handler, async ({ context }) => {
	await ensureMe(context.userId);
	return (await (await db())`
      select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2,
        s.name as negotiator_name, (current_date - v.viewed_on)::int as days
      from viewings v
      join properties p on p.id = v.property_id
      left join staff s on s.id = v.negotiator_id
      order by v.viewed_on desc, v.viewed_at desc
    `).map(mapViewing);
});
function historicStatus(status) {
	return status === "let_agreed" || status === "let";
}
var importDiary_createServerFn_handler = createServerRpc({
	id: "25c670279bfdf0bf41335e970b5735d316c6beeef020d9e886d4e5a125190055",
	name: "importDiary",
	filename: "src/lib/office.ts"
}, (opts) => importDiary.__executeServer(opts));
var importDiary = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(importDiary_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await db();
	const properties = await sql`
      select id, address, postcode, address_key, agency, status, landlord_name, landlord_email, landlord_name_2, landlord_email_2 from properties
    `;
	const people = await sql`select id, name, user_id from staff`;
	let createdProperties = 0;
	let createdViewings = 0;
	let namedViewings = 0;
	let skipped = 0;
	const createdStaff = [];
	const propertyRows = [...properties];
	const staffRows = [...people];
	const held = /* @__PURE__ */ new Map();
	for (const row of data.rows ?? []) {
		const staffName = titleName(row.staffName || "");
		const date = (row.date || "").slice(0, 10);
		const address = (row.address || "").trim();
		const agency = row.agency === "gr" ? "gr" : "al";
		if (!staffName || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !address || !isViewingEvent(row.event || "Viewing")) {
			skipped += 1;
			continue;
		}
		if (reviewDiaryRow({
			staffName,
			date,
			time: row.time || "",
			address,
			viewerName: row.viewerName || "",
			viewerEmail: row.viewerEmail || "",
			landlordEmail: row.landlordEmail || "",
			landlordEmail2: row.landlordEmail2 || ""
		}).length) {
			skipped += 1;
			continue;
		}
		let staff = staffRows.find((person) => namesMatch(text(person.name), staffName) && norm(text(person.name)) === norm(staffName));
		if (!staff) {
			const loose = staffRows.filter((person) => namesMatch(text(person.name), staffName));
			staff = loose.length === 1 ? loose[0] : void 0;
		}
		if (!staff) {
			staff = (await sql`
          insert into staff (name, role, agency, active) values (${staffName}, 'negotiator', ${agency}, true) returning id, name, user_id
        `)[0];
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
		const sameAddress = (item) => keysMatch(text(item.address_key), key) || keysMatch(addressKey(`${text(item.address)} ${text(item.postcode)}`), key);
		let property = row.reuseId ? propertyRows.find((item) => num(item.id) === num(row.reuseId)) : void 0;
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
					rows: []
				};
				group.rows.push(row);
				held.set(propertyId, group);
				continue;
			}
		}
		if (!property) {
			const split = splitPostcode(address);
			property = (await sql`
          insert into properties (
            address, address_key, postcode, agency, landlord_name, landlord_email, landlord_name_2, landlord_email_2, status, marketed_on, negotiator_id, notes
          ) values (
            ${split.address || address}, ${key}, ${split.postcode}, ${agency},
            ${landlordName || "To be added"}, ${landlordEmail}, ${landlordName2}, ${landlordEmail2},
            'available', ${date}, ${staffId}, ''
          ) returning id, address, postcode, address_key, agency, status, landlord_name, landlord_email, landlord_name_2, landlord_email_2
        `)[0];
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
			if (nextName !== currentName || nextEmail !== text(property.landlord_email) || nextName2 !== text(property.landlord_name_2) || nextEmail2 !== text(property.landlord_email_2)) {
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
		if ((await sql`
        select id from viewings
        where property_id = ${propertyId} and viewed_on = ${date} and viewed_at = ${row.time || ""}
          and negotiator_id = ${staffId} and lower(viewer_name) = lower(${viewer})
        limit 1
      `)[0]) {
			skipped += 1;
			continue;
		}
		if (viewer) {
			const blank = await sql`
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
		const insertedViewing = await sql`
        insert into viewings (property_id, viewed_on, viewed_at, viewer_name, viewer_phone, viewer_email, negotiator_id, notes)
        values (
          ${propertyId}, ${date}, ${row.time || ""}, ${viewer}, ${viewerPhone}, ${viewerEmail},
          ${staffId}, ${row.notes || ""}
        ) returning id
      `;
		createdViewings += 1;
		await logActivity(propertyId, "Viewing booked", `${date} ${row.time} · ${staffName}${viewer ? ` · ${viewer}` : ""}`, me.name, num(insertedViewing[0]?.id));
	}
	return {
		createdProperties,
		createdViewings,
		namedViewings,
		createdStaff,
		skipped,
		letAgreed: [...held.values()]
	};
});
var deleteViewing_createServerFn_handler = createServerRpc({
	id: "94706ad269d302c23548779aee6baf83c2bfa11c70d58ab01e654cd7b23b839b",
	name: "deleteViewing",
	filename: "src/lib/office.ts"
}, (opts) => deleteViewing.__executeServer(opts));
var deleteViewing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(deleteViewing_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	if (me.role !== "admin") throw new Error("Only an administrator can delete a viewing.");
	const sql = await db();
	const id = num(data.id);
	const viewing = (await sql`select id, property_id, viewed_on, viewed_at from viewings where id = ${id} limit 1`)[0];
	if (!viewing) throw new Error("Viewing not found");
	await sql`delete from emails where viewing_id = ${id}`;
	await sql`delete from activity where viewing_id = ${id}`;
	await sql`delete from viewings where id = ${id}`;
	await logActivity(num(viewing.property_id), "Viewing deleted", `${text(viewing.viewed_on)} ${text(viewing.viewed_at)}`.trim(), me.name);
	return { ok: true };
});
var listStaff_createServerFn_handler = createServerRpc({
	id: "1d185155ad87b876d3c2ef155c2f6363fb3984dc9a1e4bfd5d922e3cdddfcead",
	name: "listStaff",
	filename: "src/lib/office.ts"
}, (opts) => listStaff.__executeServer(opts));
var listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listStaff_createServerFn_handler, async ({ context }) => {
	await ensureMe(context.userId);
	return staffStats("");
});
var saveStaff_createServerFn_handler = createServerRpc({
	id: "64bbcf04a40bb8b0a6aa31e4d779127f3f3fe9161289f26b826e55a035e86f13",
	name: "saveStaff",
	filename: "src/lib/office.ts"
}, (opts) => saveStaff.__executeServer(opts));
var saveStaff = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveStaff_createServerFn_handler, async ({ data, context }) => {
	if ((await ensureMe(context.userId)).role !== "admin") throw new Error("Only an administrator can add or edit staff.");
	const name = data.name.trim();
	if (!name) throw new Error("Enter the staff name.");
	const role = [
		"admin",
		"manager",
		"negotiator"
	].includes(data.role) ? data.role : "negotiator";
	const agency = data.agency === "gr" ? "gr" : "al";
	const username = (data.username ?? "").trim().toLowerCase();
	const password = data.password ?? "";
	const sql = await ensureStaffLoginColumns();
	if (username) {
		staffLoginEmail(username);
		if ((await sql`
        select id from staff where lower(username) = ${username} and id <> ${data.id ?? 0} limit 1
      `)[0]) throw new Error("That username is already in use.");
	}
	if (data.id) {
		const current = await sql`select * from staff where id = ${data.id}`;
		if (!current[0]) throw new Error("Staff member not found");
		let userId = text(current[0].user_id);
		if (username && password) userId = await createCredentialUser(name, username, password);
		else if (username && !userId) throw new Error("Set a password the first time you give someone a username.");
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
	return { id: num((await sql`
      insert into staff (user_id, name, email, username, role, agency, active, must_change_password)
      values (${await createCredentialUser(name, username, password)}, ${name}, ${data.email ?? ""}, ${username}, ${role}, ${agency}, ${data.active}, true)
      returning id
    `)[0]?.id) };
});
var changeOwnPassword_createServerFn_handler = createServerRpc({
	id: "6214ef86f9d5c180c2f4f0632a91966775984a07d405b7a2d23253d26b2edd18",
	name: "changeOwnPassword",
	filename: "src/lib/office.ts"
}, (opts) => changeOwnPassword.__executeServer(opts));
var changeOwnPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(changeOwnPassword_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	if (data.nextPassword.length < 8) throw new Error("Use at least 8 characters.");
	const sql = await db();
	const account = (await sql`
      select "id" as id, "password" as password from "account"
      where "userId" = ${context.userId} and "providerId" = 'credential' limit 1
    `)[0];
	if (!account?.password) throw new Error("This login has no password yet.");
	if (!await verifyPassword$1({
		hash: account.password,
		password: data.currentPassword
	})) throw new Error("The current password is not right.");
	await upsertCredential(context.userId, data.nextPassword);
	await sql`update staff set must_change_password = false where id = ${me.id}`;
	return { ok: true };
});
var resetStaffPassword_createServerFn_handler = createServerRpc({
	id: "d9680284442d861927abb7259d24b004767dc82e9be8a057c06048ef5a0de34e",
	name: "resetStaffPassword",
	filename: "src/lib/office.ts"
}, (opts) => resetStaffPassword.__executeServer(opts));
var resetStaffPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(resetStaffPassword_createServerFn_handler, async ({ data, context }) => {
	if ((await ensureMe(context.userId)).role !== "admin") throw new Error("Only an administrator can reset a password.");
	if (data.password.length < 8) throw new Error("Use at least 8 characters.");
	const sql = await ensureStaffLoginColumns();
	const person = (await sql`select * from staff where id = ${data.id} limit 1`)[0];
	if (!person) throw new Error("Staff member not found");
	const username = text(person.username);
	if (!username) throw new Error("This person has no username yet. Add one on the Staff page first.");
	await sql`
      update staff set user_id = ${await createCredentialUser(text(person.name), username, data.password)}, must_change_password = true where id = ${data.id}
    `;
	return {
		ok: true,
		name: text(person.name)
	};
});
var getSettings_createServerFn_handler = createServerRpc({
	id: "e35f4ebbd7a9ac007a3b1c8381138b3eadf6518f0d0cd684ccefa080ad8874c4",
	name: "getSettings",
	filename: "src/lib/office.ts"
}, (opts) => getSettings.__executeServer(opts));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSettings_createServerFn_handler, async ({ context }) => {
	await ensureMe(context.userId);
	return (await (await ensureGmailMailbox())`select * from mailboxes order by agency`).map((row) => ({
		agency: text(row.agency),
		fromAddress: text(row.from_address),
		fromName: text(row.from_name),
		tenantId: text(row.tenant_id),
		clientId: text(row.client_id),
		hasSecret: Boolean(text(row.client_secret)),
		live: row.live === true,
		kind: text(row.kind) || "graph"
	}));
});
var saveMailbox_createServerFn_handler = createServerRpc({
	id: "09dc536fba612986bcee0c6f23e26b4c6cee038a2bf69f9893989a02e9c51c5b",
	name: "saveMailbox",
	filename: "src/lib/office.ts"
}, (opts) => saveMailbox.__executeServer(opts));
var saveMailbox = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveMailbox_createServerFn_handler, async ({ data, context }) => {
	assertManager((await ensureMe(context.userId)).role);
	if (data.agency !== "al" && data.agency !== "gr") throw new Error("Choose Andrew Lees or Gibbins Richards.");
	const fromAddress = data.fromAddress.trim();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) throw new Error("Enter a valid email address for this branch.");
	const sql = await db();
	const current = await sql`select client_secret from mailboxes where agency = ${data.agency}`;
	const nextSecret = data.clientSecret && !data.clientSecret.startsWith("•") ? data.clientSecret.trim() : text(current[0]?.client_secret);
	await sql`
      update mailboxes set from_address = ${fromAddress}, tenant_id = ${data.tenantId.trim()}, client_id = ${data.clientId.trim()},
        client_secret = ${nextSecret}, live = ${Boolean(data.live && nextSecret && data.tenantId && data.clientId)}
      where agency = ${data.agency}
    `;
	return { ok: true };
});
var saveGmailTrial_createServerFn_handler = createServerRpc({
	id: "ab5c0a91dd902a7f35fffd853d02be49a888dfd7ab666ad3854404d3cf5a552b",
	name: "saveGmailTrial",
	filename: "src/lib/office.ts"
}, (opts) => saveGmailTrial.__executeServer(opts));
var saveGmailTrial = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveGmailTrial_createServerFn_handler, async ({ data, context }) => {
	assertManager((await ensureMe(context.userId)).role);
	const address = data.address.trim();
	if (address && !/^[^\s@]+@gmail\.com$/i.test(address) && !/^[^\s@]+@googlemail\.com$/i.test(address)) throw new Error("Use a Gmail address, such as name@gmail.com.");
	const sql = await ensureGmailMailbox();
	const current = await sql`select client_secret from mailboxes where agency = 'gmail'`;
	const nextSecret = data.appPassword.trim() ? data.appPassword.replace(/\s+/g, "") : text(current[0]?.client_secret);
	const live = Boolean(data.live && address && nextSecret);
	await sql`
      update mailboxes set from_address = ${address}, client_secret = ${nextSecret}, live = ${live}, kind = 'smtp'
      where agency = 'gmail'
    `;
	return {
		ok: true,
		live
	};
});
var sendGmailTest_createServerFn_handler = createServerRpc({
	id: "dc24496dd2b9bd42833d2d8de5fe25504afea90c4c5d27ce77e00ca7cb554659",
	name: "sendGmailTest",
	filename: "src/lib/office.ts"
}, (opts) => sendGmailTest.__executeServer(opts));
var sendGmailTest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(sendGmailTest_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	assertManager(me.role);
	const current = await (await ensureGmailMailbox())`select client_secret from mailboxes where agency = 'gmail'`;
	const password = data.appPassword.trim() ? data.appPassword.replace(/\s+/g, "") : text(current[0]?.client_secret);
	const address = data.address.trim();
	await sendViaGmail(address, password, [address], "Feedy Gmail trial", `This is a test from Feedy, sent by ${me.name}. Landlord feedback can leave from this Gmail while the trial is switched on.`);
	return { ok: true };
});
function branchAgency(value) {
	if (value === "gr") return "gr";
	if (value === "al") return "al";
	return "";
}
function isGmailAddress(value) {
	return /^[^\s@]+@(gmail|googlemail)\.com$/i.test(value.trim());
}
var saveBranchGmail_createServerFn_handler = createServerRpc({
	id: "131720d6a909f57c2ca1d51ae58ffeaea1a9296a69dbf7c2f3c33345dd7f93cb",
	name: "saveBranchGmail",
	filename: "src/lib/office.ts"
}, (opts) => saveBranchGmail.__executeServer(opts));
var saveBranchGmail = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveBranchGmail_createServerFn_handler, async ({ data, context }) => {
	assertManager((await ensureMe(context.userId)).role);
	const agency = branchAgency(data.agency);
	if (!agency) throw new Error("Choose Andrew Lees or Gibbins Richards.");
	const address = data.address.trim();
	if (!isGmailAddress(address)) throw new Error("Use the Gmail address for this branch, such as name@gmail.com.");
	const sql = await ensureGmailMailbox();
	const current = await sql`select client_secret, kind from mailboxes where agency = ${agency}`;
	const saved = text(current[0]?.kind) === "smtp" ? text(current[0]?.client_secret) : "";
	const nextSecret = data.appPassword.trim() ? data.appPassword.replace(/\s+/g, "") : saved;
	if (!nextSecret) throw new Error("Paste the 16-character app password from that Gmail account.");
	const live = Boolean(data.live && nextSecret);
	await sql`
      update mailboxes set from_address = ${address}, client_secret = ${nextSecret}, live = ${live}, kind = 'smtp',
        from_name = ${agency === "gr" ? "Gibbins Richards Lettings" : "Andrew Lees Lettings"}
      where agency = ${agency}
    `;
	return {
		ok: true,
		live
	};
});
var sendBranchGmailTest_createServerFn_handler = createServerRpc({
	id: "48866bd60eca7445f1d1d37cf24cb091d9b955a1dd3cfea6077b0b7f4b056dbb",
	name: "sendBranchGmailTest",
	filename: "src/lib/office.ts"
}, (opts) => sendBranchGmailTest.__executeServer(opts));
var sendBranchGmailTest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(sendBranchGmailTest_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	assertManager(me.role);
	const agency = branchAgency(data.agency);
	if (!agency) throw new Error("Choose a branch.");
	const address = data.address.trim();
	if (!isGmailAddress(address)) throw new Error("Use the Gmail address for this branch, such as name@gmail.com.");
	const current = await (await ensureGmailMailbox())`select client_secret, kind from mailboxes where agency = ${agency}`;
	const saved = text(current[0]?.kind) === "smtp" ? text(current[0]?.client_secret) : "";
	await sendViaGmail(address, data.appPassword.trim() ? data.appPassword.replace(/\s+/g, "") : saved, [address], `Feedy test · ${agency === "gr" ? "Gibbins Richards" : "Andrew Lees"}`, `This is a test from Feedy, sent by ${me.name}. Feedback for this branch will leave from this Gmail address.`);
	return { ok: true };
});
var sendFeedback_createServerFn_handler = createServerRpc({
	id: "a2ec0219b673bd37537f43717656ad3a35d5b0dd398c44a3127a75ce0af17122",
	name: "sendFeedback",
	filename: "src/lib/office.ts"
}, (opts) => sendFeedback.__executeServer(opts));
var sendFeedback = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(sendFeedback_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await ensureGmailMailbox();
	const viewings = await sql`select property_id, interest from viewings where id = ${data.viewingId}`;
	if (!viewings[0]) throw new Error("Viewing not found");
	const agency = data.agency === "gr" ? "gr" : "al";
	const mailbox = await sql`select * from mailboxes where agency = ${agency}`;
	const gmail = await sql`select * from mailboxes where agency = 'gmail'`;
	const branchAddress = text(mailbox[0]?.from_address);
	const branchSecret = text(mailbox[0]?.client_secret);
	const branchGmail = text(mailbox[0]?.kind) === "smtp" && mailbox[0]?.live === true && Boolean(branchAddress) && Boolean(branchSecret);
	const gmailAddress = text(gmail[0]?.from_address);
	const gmailSecret = text(gmail[0]?.client_secret);
	const gmailLive = gmail[0]?.live === true && Boolean(gmailAddress) && Boolean(gmailSecret);
	const graphLive = mailbox[0]?.live === true && text(mailbox[0]?.kind) !== "smtp" && text(mailbox[0]?.tenant_id) && text(mailbox[0]?.client_id) && Boolean(branchSecret);
	let from = branchGmail ? branchAddress : gmailLive ? gmailAddress : branchAddress || agencyEmail(agency);
	const recipients = data.to.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
	if (!recipients.length) throw new Error("Enter the landlord email address.");
	let status = "not_sent";
	let error = "";
	if (branchGmail && mailbox[0]) try {
		await sendViaGmail(branchAddress, branchSecret, recipients, data.subject, data.body);
		status = "sent";
		from = branchAddress;
	} catch (err) {
		error = err instanceof Error ? err.message : "Gmail did not send the email.";
	}
	else if (graphLive && mailbox[0]) try {
		await graphSend({
			tenant: text(mailbox[0].tenant_id),
			client: text(mailbox[0].client_id),
			secret: branchSecret,
			from
		}, recipients, data.subject, data.body);
		status = "sent";
	} catch (err) {
		error = err instanceof Error ? err.message : "Microsoft did not send the email.";
	}
	else if (gmailLive) try {
		await sendViaGmail(gmailAddress, gmailSecret, recipients, data.subject, data.body);
		status = "sent";
		from = gmailAddress;
	} catch (err) {
		error = err instanceof Error ? err.message : "Gmail did not send the email.";
	}
	else error = "Add this branch's Gmail address in Settings and tick send from this Gmail. The email was kept here and was not sent.";
	await sql`
      insert into emails (viewing_id, sent_by, from_address, to_address, subject, body, agency, status, error)
      values (
        ${data.viewingId}, ${me.id}, ${from}, ${recipients.join(", ")}, ${data.subject}, ${data.body}, ${agency}, ${status}, ${error}
      )
    `;
	if (status === "sent") {
		const chasing = text(viewings[0].interest) === "no_feedback";
		if (!chasing) await sql`update viewings set feedback_status = 'sent' where id = ${data.viewingId}`;
		await logActivity(num(viewings[0].property_id), chasing ? "Landlord told there is no feedback yet" : "Feedback emailed to landlord", recipients.join(", "), me.name, data.viewingId);
	}
	return {
		sent: status === "sent",
		error,
		from
	};
});
async function graphSend(mailbox, to, subject, body) {
	const tokenRes = await fetch(`https://login.microsoftonline.com/${mailbox.tenant}/oauth2/v2.0/token`, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: mailbox.client,
			client_secret: mailbox.secret,
			scope: "https://graph.microsoft.com/.default",
			grant_type: "client_credentials"
		})
	});
	if (!tokenRes.ok) throw new Error(`Microsoft sign-in failed (${tokenRes.status}). Check the tenant, app id and secret.`);
	const token = await tokenRes.json();
	const send = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox.from)}/sendMail`, {
		method: "POST",
		headers: {
			authorization: `Bearer ${token.access_token}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({
			message: {
				subject,
				body: {
					contentType: "Text",
					content: body
				},
				toRecipients: to.map((address) => ({ emailAddress: { address } }))
			},
			saveToSentItems: true
		})
	});
	if (!send.ok) {
		const detail = (await send.text()).slice(0, 220);
		throw new Error(detail || `Microsoft refused the email (${send.status}).`);
	}
}
var getReports_createServerFn_handler = createServerRpc({
	id: "ac435b4244718d231225394a834ee098c99be1868b50aca6acd84a429af66387",
	name: "getReports",
	filename: "src/lib/office.ts"
}, (opts) => getReports.__executeServer(opts));
var getReports = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data ?? {}).handler(getReports_createServerFn_handler, async ({ data, context }) => {
	await ensureMe(context.userId);
	const sql = await db();
	const agency = data.agency === "al" || data.agency === "gr" ? data.agency : "";
	const params = [];
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
	const byProperty = await sql.query(`select p.address, p.status, count(*)::int as viewings,
        count(*) filter (where v.feedback_status in ${DONE})::int as done
       from viewings v join properties p on p.id = v.property_id
       where ${where} group by p.id, p.address, p.status order by viewings desc limit 30`, params);
	const byStaff = await staffStats(agency);
	const reasons = await sql.query(`select v.feedback_json from viewings v join properties p on p.id = v.property_id
       where ${where} and v.interest = 'not_interested'`, params);
	const counts = /* @__PURE__ */ new Map();
	for (const row of reasons) {
		const fields = safeJson(text(row.feedback_json));
		const reason = fields.reasons || fields.viewerFeedback || "";
		for (const part of reason.split(/[;\n]/).map((item) => item.trim()).filter((item) => item.length > 2)) counts.set(part, (counts.get(part) ?? 0) + 1);
	}
	const hot = await sql.query(`select p.address, count(*)::int as viewings from viewings v
       join properties p on p.id = v.property_id
       where ${where} and p.status = 'available'
       group by p.id, p.address having count(*) >= 1
       order by viewings desc limit 10`, params);
	const interested = await sql.query(`select p.address, v.viewer_name, v.viewed_on, v.interest from viewings v
       join properties p on p.id = v.property_id
       where ${where} and (v.interest in ('interested','very_interested') or v.feedback_status = 'interested')
       order by v.viewed_on desc limit 30`, params);
	const total = byProperty.reduce((sum, row) => sum + num(row.viewings), 0);
	const done = byProperty.reduce((sum, row) => sum + num(row.done), 0);
	return {
		byProperty: byProperty.map((row) => ({
			address: text(row.address),
			status: text(row.status),
			viewings: num(row.viewings),
			done: num(row.done)
		})),
		staff: byStaff,
		reasons: [...counts.entries()].map(([reason, count]) => ({
			reason,
			count
		})).sort((a, b) => b.count - a.count).slice(0, 8),
		stillAvailable: hot.map((row) => ({
			address: text(row.address),
			viewings: num(row.viewings)
		})),
		interested: interested.map((row) => ({
			address: text(row.address),
			viewer: text(row.viewer_name),
			date: dateText(row.viewed_on) ?? "",
			interest: text(row.interest)
		})),
		percent: total ? Math.round(done / total * 100) : 0,
		viewings: total
	};
});
//#endregion
export { addViewing_createServerFn_handler, archiveProperty_createServerFn_handler, changeOwnPassword_createServerFn_handler, deleteViewing_createServerFn_handler, getBoard_createServerFn_handler, getMe_createServerFn_handler, getProperty_createServerFn_handler, getReports_createServerFn_handler, getSettings_createServerFn_handler, importDiary_createServerFn_handler, listProperties_createServerFn_handler, listStaff_createServerFn_handler, listViewings_createServerFn_handler, markApplication_createServerFn_handler, markContacted_createServerFn_handler, prepareSignIn_createServerFn_handler, resetStaffPassword_createServerFn_handler, resolveLogin_createServerFn_handler, saveBranchGmail_createServerFn_handler, saveFeedback_createServerFn_handler, saveGmailTrial_createServerFn_handler, saveLandlord_createServerFn_handler, saveMailbox_createServerFn_handler, saveProperty_createServerFn_handler, saveStaff_createServerFn_handler, sendBranchGmailTest_createServerFn_handler, sendFeedback_createServerFn_handler, sendGmailTest_createServerFn_handler, setLetAgreed_createServerFn_handler };
