#!/usr/bin/env node
/**
 * Per-file fixes for the pre-existing ActionMenu `row` prop issues.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// Each entry: { file, typeName, itemArrVar (optional), rowPropExpr }
// - typeName: e.g. "Category" — used to type `ActionItem<TypeName>[]`
// - itemArrVar: the variable holding the items array (default "items")
// - rowPropExpr: the expression for `row={...}` on ActionMenu
const FIXES = [
  // app routes — items arrays don't carry the data type easily; we
  // special-case them inline.
  {
    file: "src/app/(admin)/operations/tickets/page.tsx",
    fix: (src) => {
      // Find the ActionMenu tag and add row={ticket} before items={...}
      return src.replace(
        /<ActionMenu(\b[^>]*?)(\/?>)/g,
        (m, attrs, close) => {
          if (/\brow\s*=/.test(attrs)) return m;
          return `<ActionMenu row={ticket}${attrs}${close}`;
        },
      );
    },
  },
  {
    file: "src/app/(admin)/permissions/page.tsx",
    fix: (src) => {
      return src.replace(
        /<ActionMenu(\b[^>]*?)(\/?>)/g,
        (m, attrs, close) => {
          if (/\brow\s*=/.test(attrs)) return m;
          return `<ActionMenu row={permission}${attrs}${close}`;
        },
      );
    },
  },
  {
    file: "src/app/(admin)/system/activity-logs/page.tsx",
    fix: (src) => {
      return src.replace(
        /<ActionMenu(\b[^>]*?)(\/?>)/g,
        (m, attrs, close) => {
          if (/\brow\s*=/.test(attrs)) return m;
          return `<ActionMenu row={log}${attrs}${close}`;
        },
      );
    },
  },
  {
    file: "src/app/(admin)/user-management/departments/page.tsx",
    fix: (src) => {
      return src.replace(
        /<ActionMenu(\b[^>]*?)(\/?>)/g,
        (m, attrs, close) => {
          if (/\brow\s*=/.test(attrs)) return m;
          return `<ActionMenu row={department}${attrs}${close}`;
        },
      );
    },
  },
  {
    file: "src/app/(admin)/user-management/roles/page.tsx",
    fix: (src) => {
      return src.replace(
        /<ActionMenu(\b[^>]*?)(\/?>)/g,
        (m, attrs, close) => {
          if (/\brow\s*=/.test(attrs)) return m;
          return `<ActionMenu row={role}${attrs}${close}`;
        },
      );
    },
  },
  {
    file: "src/app/(admin)/user-management/users/page.tsx",
    fix: (src) => {
      return src.replace(
        /<ActionMenu(\b[^>]*?)(\/?>)/g,
        (m, attrs, close) => {
          if (/\brow\s*=/.test(attrs)) return m;
          return `<ActionMenu row={user}${attrs}${close}`;
        },
      );
    },
  },
  // feature tables — TanStack Table pattern
  {
    file: "src/features/categories/components/category-table.tsx",
    typeName: "Category",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/delivery-types/components/delivery-type-table.tsx",
    typeName: "DeliveryType",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/loading-points/components/loading-point-table.tsx",
    typeName: "LoadingPoint",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/material-models/components/material-model-table.tsx",
    typeName: "MaterialModel",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/organizations/components/organization-table.tsx",
    typeName: "Organization",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/reject-reasons/components/reject-reason-table.tsx",
    typeName: "RejectReason",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/status-items/components/status-item-table.tsx",
    typeName: "StatusItem",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/suppliers/components/supplier-table.tsx",
    typeName: "Supplier",
    itemArrVar: "items",
    rowPropExpr: "row.original",
  },
  {
    file: "src/features/units/components/unit-table.tsx",
    typeName: "Unit",
    itemArrVar: "actions",
    rowPropExpr: "row.original",
  },
  // departments container — local var inside .map((dept) =>)
  {
    file: "src/features/departments/components/department-list.container.tsx",
    typeName: "Department",
    itemArrVar: "items",
    rowPropExpr: "department",
  },
  // materials-receiving — has a RowActions subcomponent
  {
    file: "src/features/materials-receiving/components/materials-receiving-table.tsx",
    typeName: "MaterialsReceiving",
    itemArrVar: "items",
    rowPropExpr: "receiving",
  },
];

const FEATURE_TABLE_REGEX = /<ActionMenu(\b[^>]*?)(\/?>)/g;

for (const entry of FIXES) {
  const full = path.join(ROOT, entry.file);
  if (!fs.existsSync(full)) {
    console.log("SKIP (missing):", entry.file);
    continue;
  }
  const before = fs.readFileSync(full, "utf8");
  let src = before;

  if (entry.fix) {
    src = entry.fix(src);
  } else {
    // Feature table path: type the items array, add row prop, replace
    // `() => handler(row.original)` with `(row) => handler(row)`.
    const { typeName, itemArrVar, rowPropExpr } = entry;
    // 1) Type the items array: `const items: ActionItem[] = [` -> `const items: ActionItem<TypeName>[] = [`
    src = src.replace(
      new RegExp(`const\\s+${itemArrVar}:\\s*ActionItem\\[\\]\\s*=\\s*\\[`, "g"),
      `const ${itemArrVar}: ActionItem<${typeName}>[] = [`,
    );
    // 2) Replace onClick callbacks using row.original
    src = src.replace(
      /onClick:\s*\(\)\s*=>\s*([A-Za-z_][\w$]*)\?\.\(([A-Za-z_][\w$]*)\)/g,
      "onClick: (row) => $1?.(row)",
    );
    src = src.replace(
      /onClick:\s*\(\)\s*=>\s*([A-Za-z_][\w$]*)\(([A-Za-z_][\w$]*)\)/g,
      "onClick: (row) => $1(row)",
    );
    // 3) Add row={rowPropExpr} to ActionMenu tag
    src = src.replace(FEATURE_TABLE_REGEX, (m, attrs, close) => {
      if (/\brow\s*=/.test(attrs)) return m;
      return `<ActionMenu row={${rowPropExpr}}${attrs}${close}`;
    });
  }

  if (src === before) {
    console.log("NO-CHANGE:", entry.file);
    continue;
  }
  fs.writeFileSync(full, src, "utf8");
  console.log("patched:", entry.file);
}
