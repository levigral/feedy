import assert from "node:assert/strict";
import test from "node:test";
import {
  diaryColumnWarnings,
  matrixFromPositionedText,
  matrixFromText,
  parseDiaryMatrix,
  parseUkDate,
  prepareDiaryImport,
} from "./diary.ts";

test("reads staff, date, time and only Viewing events", () => {
  const drafts = parseDiaryMatrix([
    ["Staff", "Date", "Time", "Event"],
    ["Katie Stewart", "14/09/2026", "09:30", "Viewing at 12 High Street, Bridgwater TA6 3AA"],
    ["Emma Clarke", "15/09/2026", "11:00", "Valuation"],
    ["Ben Maxwell", "16/09/2026", "13:15", "Viewing"],
  ]);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0]?.keep, true);
  assert.equal(drafts[0]?.staffName, "Katie Stewart");
  assert.equal(drafts[0]?.date, "2026-09-14");
  assert.equal(drafts[0]?.time, "09:30");
  assert.match(drafts[0]?.address ?? "", /12 High Street/);
  assert.equal(drafts[1]?.date, "2026-09-16");
  assert.equal(drafts[1]?.address, "");
  assert.equal(drafts[1]?.keep, true);
});

test("uses the date column even when it is last week", () => {
  const drafts = parseDiaryMatrix([
    ["Katie Stewart", "09/09/2026", "10:00", "Viewing at 4 Queen Street"],
  ]);
  assert.equal(drafts[0]?.date, "2026-09-09");
  assert.notEqual(drafts[0]?.date, parseUkDate("23/09/2026"));
});

test("written dates and a property column", () => {
  const drafts = parseDiaryMatrix([
    ["Negotiator", "Date", "Time", "Event", "Property"],
    ["Katie Stewart", "14 September 2026", "2:15 pm", "Viewing", "6 Clipper Close, Burnham TA8 1AA"],
  ]);
  assert.equal(drafts[0]?.date, "2026-09-14");
  assert.equal(drafts[0]?.time, "14:15");
  assert.match(drafts[0]?.address ?? "", /Clipper Close/);
  assert.equal(drafts[0]?.keep, true);
});

test("pdf-style columns stay in staff, date, time, event order", () => {
  const matrix = matrixFromPositionedText([
    { str: "Staff", x: 20, y: 700, page: 1 },
    { str: "Date", x: 160, y: 700, page: 1 },
    { str: "Time", x: 280, y: 700, page: 1 },
    { str: "Event", x: 380, y: 700, page: 1 },
    { str: "Katie", x: 20, y: 680, page: 1 },
    { str: "Stewart", x: 55, y: 680, page: 1 },
    { str: "14/09/2026", x: 160, y: 680, page: 1 },
    { str: "09:30", x: 280, y: 680, page: 1 },
    { str: "Viewing", x: 380, y: 680, page: 1 },
    { str: "at", x: 430, y: 680, page: 1 },
    { str: "12", x: 450, y: 680, page: 1 },
    { str: "High", x: 470, y: 680, page: 1 },
    { str: "Street", x: 500, y: 680, page: 1 },
  ]);
  const drafts = parseDiaryMatrix(matrix);
  assert.equal(drafts[0]?.staffName, "Katie Stewart");
  assert.equal(drafts[0]?.date, "2026-09-14");
  assert.equal(drafts[0]?.time, "09:30");
  assert.match(drafts[0]?.address ?? "", /12 High Street/);
});

test("ignores valuations and follows the negotiator and day heading", () => {
  const drafts = parseDiaryMatrix([
    ["Katie Stewart"],
    ["Wednesday 16 September 2026"],
    ["09:30", "Valuation", "4 Queen Street"],
    ["11:00", "Viewing", "12 High Street, Bridgwater TA6 3AA"],
    ["Emma Clarke"],
    ["14:15", "Second viewing", "6 Clipper Close"],
    ["15:00", "Meeting", "Office"],
  ]);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0]?.staffName, "Katie Stewart");
  assert.equal(drafts[0]?.date, "2026-09-16");
  assert.equal(drafts[0]?.time, "11:00");
  assert.match(drafts[0]?.address ?? "", /12 High Street/);
  assert.equal(drafts[1]?.staffName, "Emma Clarke");
  assert.equal(drafts[1]?.date, "2026-09-16");
  assert.match(drafts[1]?.address ?? "", /Clipper Close/);
  assert.equal(drafts[0]?.keep, true);
  assert.equal(drafts[1]?.keep, true);
});

test("appointment column keeps only the viewing keyword", () => {
  const drafts = parseDiaryMatrix([
    ["Negotiator", "Date", "Time", "Appointment", "Property"],
    ["Katie Stewart", "14/09/2026", "09:30", "Market appraisal", "1 High Street"],
    ["Katie Stewart", "14/09/2026", "10:30", "Viewing", "8 King Street, Bridgwater"],
  ]);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.date, "2026-09-14");
  assert.equal(drafts[0]?.staffName, "Katie Stewart");
  assert.match(drafts[0]?.address ?? "", /King Street/);
});

test("viewings csv is staff, date and the start of the time range", () => {
  const drafts = parseDiaryMatrix(
    matrixFromText(`staff_member,appointment_date,appointment_time
Katie Stewart,2026-09-15,10:00-10:30
Katie Stewart,2026-09-15,16:15-16:30
Katie Stewart,2026-09-16,09:45-10:00
Katie Stewart,2026-09-16,10:00-10:15
Katie Stewart,2026-09-16,10:45-11:00
Katie Stewart,2026-09-16,13:00-13:15
Levi Holland,2026-09-16,15:30-15:45`),
  );
  assert.equal(drafts.length, 7);
  assert.equal(drafts[0]?.staffName, "Katie Stewart");
  assert.equal(drafts[0]?.date, "2026-09-15");
  assert.equal(drafts[0]?.time, "10:00");
  assert.equal(drafts[0]?.event, "Viewing");
  assert.equal(drafts[0]?.keep, true);
  assert.equal(drafts[6]?.staffName, "Levi Holland");
  assert.equal(drafts[6]?.date, "2026-09-16");
  assert.equal(drafts[6]?.time, "15:30");
});

test("checks a csv before import and rejects a bad email, a missing viewer and a repeat", () => {
  const drafts = prepareDiaryImport(
    parseDiaryMatrix(
      matrixFromText(`staff_member,appointment_date,appointment_time,event,property,Viewer Name,landlord_1_email
Katie Stewart,15/09/2026,10:00,Viewing,12 High Street,Sam Patel,anne@example.com
Katie Stewart,15/09/2026,10:00,Viewing,12 High Street,Sam Patel,anne@example.com
Katie Stewart,15/09/2026,11:00,Viewing,4 Queen Street,,not-an-email
Katie Stewart,32/13/2026,09:00,Viewing,8 King Street,Jo Lee,`),
    ),
    { requireViewer: true },
  );
  assert.equal(drafts[0]?.issues.length, 0);
  assert.match(drafts[1]?.issue ?? "", /repeated/);
  assert.match(drafts[2]?.issue ?? "", /Viewer name is missing/);
  assert.match(drafts[2]?.issue ?? "", /Landlord email/);
  assert.match(drafts[3]?.issue ?? "", /Date is missing/);
  assert.match(diaryColumnWarnings(matrixFromText("staff_member,appointment_date,appointment_time,property\nKatie,15/09/2026,10:00,12 High Street")).join(" "), /Viewer Name/);
});

test("reads the Viewer Name column onto the viewing", () => {
  const drafts = parseDiaryMatrix(
    matrixFromText(`staff_member,appointment_date,appointment_time,property,Viewer Name,landlord_1_name,landlord_1_email
Katie Stewart,15/09/2026,10:00,12 High Street Bridgwater,Sam Patel,Anne Baker,anne@example.com
Katie Stewart,15/09/2026,11:30,4 Queen Street,Jo Lee,,`),
  );
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0]?.viewerName, "Sam Patel");
  assert.equal(drafts[0]?.landlordName, "Anne Baker");
  assert.equal(drafts[1]?.viewerName, "Jo Lee");
  assert.match(drafts[1]?.address ?? "", /Queen Street/);
  assert.equal(drafts[0]?.keep, true);
});

test("reads landlord 1 and landlord 2 names and emails", () => {
  const drafts = parseDiaryMatrix(
    matrixFromText(`staff_member,appointment_date,appointment_time,property,landlord_1_name,landlord_1_email,landlord_1_address,landlord_2_name,landlord_2_email
Katie Stewart,15/09/2026,10:00,12 High Street,Anne Baker,anne@example.com,1 Oak Lane,Paul Baker,paul@example.com`),
  );
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.staffName, "Katie Stewart");
  assert.equal(drafts[0]?.date, "2026-09-15");
  assert.match(drafts[0]?.address ?? "", /12 High Street/);
  assert.equal(drafts[0]?.landlordName, "Anne Baker");
  assert.equal(drafts[0]?.landlordEmail, "anne@example.com");
  assert.equal(drafts[0]?.landlordName2, "Paul Baker");
  assert.equal(drafts[0]?.landlordEmail2, "paul@example.com");
  assert.equal(drafts[0]?.keep, true);
});
