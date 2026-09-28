import { buttonClass, Field, inputClass, quietClass } from "@/components/chrome";
import { UkDateInput } from "@/components/uk-date";
import { useState } from "react";

export type PropertyFormValue = {
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

export const emptyProperty: PropertyFormValue = {
  address: "",
  postcode: "",
  agency: "al",
  rent: "",
  landlordName: "",
  landlordEmail: "",
  landlordPhone: "",
  landlordEmail2: "",
  landlordName2: "",
  status: "available",
  marketedOn: "",
  negotiatorId: null,
  notes: "",
};

export function PropertyForm({
  initial,
  staff,
  onSave,
  onCancel,
}: {
  initial: PropertyFormValue;
  staff: Array<{ id: number; name: string }>;
  onSave: (value: PropertyFormValue) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function set<K extends keyof PropertyFormValue>(key: K, next: PropertyFormValue[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        onSave(value).catch((err: unknown) => { setError(err instanceof Error ? err.message : "Could not save"); setBusy(false); });
      }}
    >
      <Field label="Address"><input className={inputClass} value={value.address} onChange={(event) => set("address", event.target.value)} required /></Field>
      <Field label="Postcode"><input className={inputClass} value={value.postcode} onChange={(event) => set("postcode", event.target.value)} /></Field>
      <Field label="Agency">
        <select className={inputClass} value={value.agency} onChange={(event) => set("agency", event.target.value)}>
          <option value="al">Andrew Lees Lettings</option>
          <option value="gr">Gibbins Richards Lettings</option>
        </select>
      </Field>
      <Field label="Advertised rent"><input className={inputClass} value={value.rent} onChange={(event) => set("rent", event.target.value)} /></Field>
      <Field label="Landlord name"><input className={inputClass} value={value.landlordName} onChange={(event) => set("landlordName", event.target.value)} /></Field>
      <Field label="Landlord email"><input className={inputClass} value={value.landlordEmail} onChange={(event) => set("landlordEmail", event.target.value)} /></Field>
      <Field label="Second landlord name"><input className={inputClass} value={value.landlordName2} onChange={(event) => set("landlordName2", event.target.value)} /></Field>
      <Field label="Second landlord email"><input className={inputClass} value={value.landlordEmail2} onChange={(event) => set("landlordEmail2", event.target.value)} /></Field>
      <Field label="Landlord phone"><input className={inputClass} value={value.landlordPhone} onChange={(event) => set("landlordPhone", event.target.value)} /></Field>
      <Field label="Status">
        <select className={inputClass} value={value.status} onChange={(event) => set("status", event.target.value)}>
          <option value="available">Available</option>
          <option value="let_agreed">Let agreed</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="let">Let</option>
        </select>
      </Field>
      <Field label="First marketed"><UkDateInput value={value.marketedOn} onChange={(next) => set("marketedOn", next)} /></Field>
      <Field label="Negotiator">
        <select className={inputClass} value={value.negotiatorId ?? ""} onChange={(event) => set("negotiatorId", event.target.value ? Number(event.target.value) : null)}>
          <option value="">Not assigned</option>
          {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </Field>
      <Field label="Notes"><textarea className="min-h-24 w-full rounded-xl border border-line p-3" value={value.notes} onChange={(event) => set("notes", event.target.value)} /></Field>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className={quietClass} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
