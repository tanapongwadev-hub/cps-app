// Exact reproduction
const ts = require("typescript");
const code = `
import * as React from "react";
interface ActionItem<T = unknown> {
  label: string;
  icon?: React.ReactElement | React.ReactNode;
  onClick: (row?: T) => void;
  variant?: "default" | "danger";
  disabled?: ((row?: T) => boolean) | boolean;
  hidden?: boolean;
}
interface MaterialsDisbursement { id: string; status: string; }
const actionItems: ActionItem<MaterialsDisbursement>[] = [
  {
    label: "x",
    icon: <div />,
    onClick: (row: MaterialsDisbursement) => console.log(row),
  },
];
console.log(actionItems);
`;
const result = ts.transpileModule(code, {
  compilerOptions: { strict: true, noEmit: true, jsx: ts.JsxEmit.React },
  reportDiagnostics: true,
});
const errs = (result.diagnostics || []).filter((d) => d.category === 1);
if (errs.length === 0) {
  console.log("OK");
} else {
  console.log("FAIL:");
  errs.forEach((d) => console.log("  ", ts.flattenDiagnosticMessageText(d.messageText, "\n")));
}
