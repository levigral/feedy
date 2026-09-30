import { o as __toESM } from "../_runtime.mjs";
import { V as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as formatUk, u as parseUkDateInput } from "./labels-DDHELNR_.mjs";
import "./router-BjwAJETe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/uk-date-CKhc9vku.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function UkDateInput({ value, onChange, required, className }) {
	const [text, setText] = (0, import_react.useState)(formatUk(value));
	(0, import_react.useEffect)(() => {
		setText(formatUk(value));
	}, [value]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: className ?? "h-11 w-full rounded-xl border border-line bg-card px-3 text-ink outline-none focus:border-pine",
		inputMode: "numeric",
		placeholder: "dd/mm/yyyy",
		"aria-label": "Date, day month year",
		value: text,
		required,
		onChange: (event) => {
			const next = event.target.value;
			setText(next);
			if (!next.trim()) {
				onChange("");
				return;
			}
			const iso = parseUkDateInput(next);
			if (iso) onChange(iso);
		},
		onBlur: () => {
			const iso = parseUkDateInput(text);
			if (iso) setText(formatUk(iso));
		}
	});
}
//#endregion
export { UkDateInput as t };
