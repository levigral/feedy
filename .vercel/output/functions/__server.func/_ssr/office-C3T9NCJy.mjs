import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as authMiddleware, n as agencyEmail, s as isFeedbackComplete } from "./labels-DbTtzT8f.mjs";
import { r as isViewingEvent, s as splitPostcode, t as addressKey } from "./diary-jhhX-lig.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office-C3T9NCJy.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
async function db() {
	const { getSql } = await import("./db-mFmcSX7C.mjs").then((n) => n.t).then((n) => n.t);
	return getSql();
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
		landlordEmail2: text(row.landlord_email_2)
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
	const sql = await db();
	const users = await sql`
    select "name" as name, "email" as email from "user" where "id" = ${userId} limit 1
  `;
	const name = users[0]?.name?.trim() || "Staff";
	const email = users[0]?.email?.trim() || "";
	const linked = await sql`select * from staff where user_id = ${userId} limit 1`;
	if (linked[0]) return mapStaff(linked[0]);
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
async function logActivity(propertyId, kind, detail, actor, viewingId) {
	await (await db())`
    insert into activity (property_id, viewing_id, kind, detail, actor)
    values (${propertyId}, ${viewingId ?? null}, ${kind}, ${detail}, ${actor})
  `;
}
var DONE = `('received','sent','interested','not_interested')`;
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
	const sql = await db();
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
	const staff = await staffStats(agency);
	const viewings = num(totals[0]?.viewings);
	const done = num(totals[0]?.done);
	return {
		activeProperties: num(active[0]?.n),
		viewings,
		done,
		outstanding: viewings - done,
		percent: viewings ? Math.round(done / viewings * 100) : 0,
		interested: num(totals[0]?.interested),
		attention: outstanding.length,
		queue: outstanding.map(mapViewing),
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
        (select count(*)::int from viewings v where v.property_id = p.id and v.feedback_status in ('received','sent','interested','not_interested')) as feedback_done,
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
        (select count(*)::int from viewings v where v.property_id = p.id and v.feedback_status in ('received','sent','interested','not_interested')) as feedback_done,
        (select min(v.viewed_on) from viewings v where v.property_id = p.id) as first_viewing
      from properties p
      left join staff s on s.id = p.negotiator_id
      left join staff g on g.id = p.let_agreed_by
      where p.id = ${id}
    `;
	if (!rows[0]) throw new Error("Property not found");
	const viewings = await sql`
      select v.*, p.address, p.postcode, p.agency, p.landlord_name, p.landlord_email, p.landlord_email_2,
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
          landlord_name=$6, landlord_email=$7, landlord_phone=$8, landlord_email_2=$9, status=$10,
          marketed_on=$11, negotiator_id=$12, notes=$13 where id=$14`, [
			address,
			key,
			postcode,
			agency,
			data.rent ?? "",
			data.landlordName ?? "",
			data.landlordEmail ?? "",
			data.landlordPhone ?? "",
			data.landlordEmail2 ?? "",
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
        landlord_email_2, status, marketed_on, negotiator_id, notes
      ) values (
        ${address}, ${key}, ${postcode}, ${agency}, ${data.rent ?? ""}, ${data.landlordName ?? ""},
        ${data.landlordEmail ?? ""}, ${data.landlordPhone ?? ""}, ${data.landlordEmail2 ?? ""},
        ${data.status || "available"}, ${marketed}, ${negotiator}, ${data.notes ?? ""}
      ) returning id
    `)[0]?.id);
	await logActivity(id, "Property added", address, me.name);
	return { id };
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
	if (data.interest === "very_interested" || data.interest === "interested") status = "interested";
	if (data.interest === "not_interested") status = "not_interested";
	if (text(current[0].feedback_status) === "sent") status = "sent";
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
var listViewings_createServerFn_handler = createServerRpc({
	id: "a4708e3a4bfb043d512297d219c798e960771a6b211be4b58e30c8eebb485022",
	name: "listViewings",
	filename: "src/lib/office.ts"
}, (opts) => listViewings.__executeServer(opts));
var listViewings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listViewings_createServerFn_handler, async ({ context }) => {
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
var importDiary_createServerFn_handler = createServerRpc({
	id: "25c670279bfdf0bf41335e970b5735d316c6beeef020d9e886d4e5a125190055",
	name: "importDiary",
	filename: "src/lib/office.ts"
}, (opts) => importDiary.__executeServer(opts));
var importDiary = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(importDiary_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await db();
	const properties = await sql`select id, address, address_key, agency from properties`;
	const people = await sql`select id, name, user_id from staff`;
	let createdProperties = 0;
	let createdViewings = 0;
	let skipped = 0;
	const createdStaff = [];
	const propertyRows = [...properties];
	const staffRows = [...people];
	for (const row of data.rows ?? []) {
		const staffName = titleName(row.staffName || "");
		const date = (row.date || "").slice(0, 10);
		const address = (row.address || "").trim();
		const agency = row.agency === "gr" ? "gr" : "al";
		if (!staffName || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !address || !isViewingEvent(row.event || "Viewing")) {
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
		let property = propertyRows.find((item) => keysMatch(text(item.address_key), key));
		if (!property) {
			const split = splitPostcode(address);
			property = (await sql`
          insert into properties (
            address, address_key, postcode, agency, landlord_name, landlord_email, status, marketed_on, negotiator_id, notes
          ) values (
            ${split.address || address}, ${key}, ${split.postcode}, ${agency}, 'To be added', '', 'available', ${date}, ${staffId}, ''
          ) returning id, address, address_key, agency
        `)[0];
			if (property) {
				propertyRows.push(property);
				createdProperties += 1;
				await logActivity(num(property.id), "Property added", "Created from the diary", me.name);
			}
		}
		const propertyId = num(property?.id);
		const viewer = (row.viewerName || "").trim();
		if ((await sql`
        select id from viewings
        where property_id = ${propertyId} and viewed_on = ${date} and viewed_at = ${row.time || ""}
          and negotiator_id = ${staffId} and lower(viewer_name) = lower(${viewer})
        limit 1
      `)[0]) {
			skipped += 1;
			continue;
		}
		const insertedViewing = await sql`
        insert into viewings (property_id, viewed_on, viewed_at, viewer_name, viewer_phone, viewer_email, negotiator_id, notes)
        values (
          ${propertyId}, ${date}, ${row.time || ""}, ${viewer}, ${row.viewerPhone || ""}, ${row.viewerEmail || ""},
          ${staffId}, ${row.notes || ""}
        ) returning id
      `;
		createdViewings += 1;
		await logActivity(propertyId, "Viewing booked", `${date} ${row.time} · ${staffName}`, me.name, num(insertedViewing[0]?.id));
	}
	return {
		createdProperties,
		createdViewings,
		createdStaff,
		skipped
	};
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
	assertManager((await ensureMe(context.userId)).role);
	const name = data.name.trim();
	if (!name) throw new Error("Enter the staff name.");
	const role = [
		"admin",
		"manager",
		"negotiator"
	].includes(data.role) ? data.role : "negotiator";
	const agency = data.agency === "gr" ? "gr" : "al";
	const sql = await db();
	if (data.id) {
		await sql`
        update staff set name = ${name}, email = ${data.email ?? ""}, role = ${role}, agency = ${agency}, active = ${data.active}
        where id = ${data.id}
      `;
		return { id: data.id };
	}
	return { id: num((await sql`
      insert into staff (name, email, role, agency, active) values (${name}, ${data.email ?? ""}, ${role}, ${agency}, ${data.active})
      returning id
    `)[0]?.id) };
});
var getSettings_createServerFn_handler = createServerRpc({
	id: "e35f4ebbd7a9ac007a3b1c8381138b3eadf6518f0d0cd684ccefa080ad8874c4",
	name: "getSettings",
	filename: "src/lib/office.ts"
}, (opts) => getSettings.__executeServer(opts));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSettings_createServerFn_handler, async ({ context }) => {
	await ensureMe(context.userId);
	return (await (await db())`select * from mailboxes order by agency`).map((row) => ({
		agency: text(row.agency),
		fromAddress: text(row.from_address),
		fromName: text(row.from_name),
		tenantId: text(row.tenant_id),
		clientId: text(row.client_id),
		hasSecret: Boolean(text(row.client_secret)),
		live: row.live === true
	}));
});
var saveMailbox_createServerFn_handler = createServerRpc({
	id: "09dc536fba612986bcee0c6f23e26b4c6cee038a2bf69f9893989a02e9c51c5b",
	name: "saveMailbox",
	filename: "src/lib/office.ts"
}, (opts) => saveMailbox.__executeServer(opts));
var saveMailbox = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveMailbox_createServerFn_handler, async ({ data, context }) => {
	assertManager((await ensureMe(context.userId)).role);
	const sql = await db();
	const current = await sql`select client_secret from mailboxes where agency = ${data.agency}`;
	const nextSecret = data.clientSecret && !data.clientSecret.startsWith("•") ? data.clientSecret.trim() : text(current[0]?.client_secret);
	await sql`
      update mailboxes set tenant_id = ${data.tenantId.trim()}, client_id = ${data.clientId.trim()},
        client_secret = ${nextSecret}, live = ${Boolean(data.live && nextSecret && data.tenantId && data.clientId)}
      where agency = ${data.agency}
    `;
	return { ok: true };
});
var sendFeedback_createServerFn_handler = createServerRpc({
	id: "a2ec0219b673bd37537f43717656ad3a35d5b0dd398c44a3127a75ce0af17122",
	name: "sendFeedback",
	filename: "src/lib/office.ts"
}, (opts) => sendFeedback.__executeServer(opts));
var sendFeedback = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(sendFeedback_createServerFn_handler, async ({ data, context }) => {
	const me = await ensureMe(context.userId);
	const sql = await db();
	const viewings = await sql`select property_id from viewings where id = ${data.viewingId}`;
	if (!viewings[0]) throw new Error("Viewing not found");
	const agency = data.agency === "gr" ? "gr" : "al";
	const mailbox = await sql`select * from mailboxes where agency = ${agency}`;
	const from = text(mailbox[0]?.from_address) || agencyEmail(agency);
	const recipients = data.to.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
	if (!recipients.length) throw new Error("Enter the landlord email address.");
	let status = "not_sent";
	let error = "";
	if (mailbox[0]?.live === true && text(mailbox[0]?.tenant_id) && text(mailbox[0]?.client_id) && text(mailbox[0]?.client_secret) && mailbox[0]) try {
		await graphSend({
			tenant: text(mailbox[0].tenant_id),
			client: text(mailbox[0].client_id),
			secret: text(mailbox[0].client_secret),
			from
		}, recipients, data.subject, data.body);
		status = "sent";
	} catch (err) {
		error = err instanceof Error ? err.message : "Microsoft did not send the email.";
	}
	else error = "Mailbox is not connected. The email was kept here and was not sent.";
	await sql`
      insert into emails (viewing_id, sent_by, from_address, to_address, subject, body, agency, status, error)
      values (
        ${data.viewingId}, ${me.id}, ${from}, ${recipients.join(", ")}, ${data.subject}, ${data.body}, ${agency}, ${status}, ${error}
      )
    `;
	if (status === "sent") {
		await sql`update viewings set feedback_status = 'sent' where id = ${data.viewingId}`;
		await logActivity(num(viewings[0].property_id), "Feedback emailed to landlord", recipients.join(", "), me.name, data.viewingId);
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
export { addViewing_createServerFn_handler, archiveProperty_createServerFn_handler, getBoard_createServerFn_handler, getMe_createServerFn_handler, getProperty_createServerFn_handler, getReports_createServerFn_handler, getSettings_createServerFn_handler, importDiary_createServerFn_handler, listProperties_createServerFn_handler, listStaff_createServerFn_handler, listViewings_createServerFn_handler, markContacted_createServerFn_handler, saveFeedback_createServerFn_handler, saveMailbox_createServerFn_handler, saveProperty_createServerFn_handler, saveStaff_createServerFn_handler, sendFeedback_createServerFn_handler, setLetAgreed_createServerFn_handler };
