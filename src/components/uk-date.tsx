import { inputClass } from "@/components/chrome";
import { formatUk, parseUkDateInput } from "@/lib/labels";
import { useEffect, useState } from "react";

export function UkDateInput({
  value,
  onChange,
  required,
  className,
}: {
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(formatUk(value));
  useEffect(() => {
    setText(formatUk(value));
  }, [value]);
  return (
    <input
      className={className ?? inputClass}
      inputMode="numeric"
      placeholder="dd/mm/yyyy"
      aria-label="Date, day month year"
      value={text}
      required={required}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (!next.trim()) {
          onChange("");
          return;
        }
        const iso = parseUkDateInput(next);
        if (iso) onChange(iso);
      }}
      onBlur={() => {
        const iso = parseUkDateInput(text);
        if (iso) setText(formatUk(iso));
      }}
    />
  );
}
