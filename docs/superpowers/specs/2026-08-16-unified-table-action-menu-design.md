# Unified Table Action Menu Design

## Goal

Make every list table's action column use one three-dot menu trigger while preserving all existing actions, permissions, status rules, callbacks, and navigation behavior.

## Scope

The change applies to list tables that expose row actions:

- Materials
- Goods receipts
- Materials receiving, including mobile cards
- Permissions, including the current “กำหนดแผนก” button
- Existing `DataTable` consumers such as users, roles, departments, activity logs, tickets, organizations, status items, material models, loading points, units, reject reasons, delivery types, suppliers, and categories

Tables that only present nested/detail data and have no action column will not gain a menu.

## Interaction Design

- Each actionable row shows exactly one ghost-style `MoreHorizontal` trigger aligned to the right.
- The trigger has an accessible label that identifies the row where a stable row label is available.
- The trigger is at least 40 by 40 pixels on mobile and may become compact on larger screens.
- Opening the trigger displays every action currently available for that row in its existing logical order.
- Common actions appear first. Destructive or cancelling actions appear after a separator and use danger styling.
- Hidden, disabled, permission-controlled, and status-controlled actions retain their current conditions.
- Clicking the trigger or a menu item must not activate a clickable table row.
- A row with no available actions renders no trigger; existing intentional empty-state treatment may remain.

## Component Design

`src/components/tables/action-menu.tsx` is the shared presentation and interaction boundary. It remains responsible for:

- filtering hidden items;
- rendering the three-dot trigger;
- rendering icons, labels, disabled state, separators, and danger styling;
- stopping click propagation;
- exposing a row-specific accessible label.

Feature tables remain responsible for building their own `ActionItem[]`. This keeps business decisions close to the feature and prevents the shared component from learning receipt statuses, material state, permissions, or routes.

The materials-receiving table's bespoke dropdown will be replaced with the shared component, without changing its action predicates. Materials, goods receipts, and permissions will replace inline action buttons with arrays passed to the same component. Tables already using `ActionMenu` require no feature-level rewrite unless a regression test identifies inconsistent markup.

## Action Preservation

- Materials: detail, edit, enable/disable, stock balance.
- Goods receipts: detail, edit, post, cancel, delete.
- Materials receiving: detail, edit, confirm, cancel, delete, with the same status and permission predicates as today.
- Permissions: manage departments, edit, delete.
- All other tables retain their existing action arrays unchanged.

No API calls, payloads, backend contracts, permissions, confirmation dialogs, routing destinations, or status transitions change.

## Responsive and Accessibility Requirements

- The action column stays narrow and right-aligned.
- Menus align to the end edge so they remain inside the viewport.
- Mobile-card action triggers use the same shared menu and maintain a practical touch target.
- Every trigger has an `aria-label`; icons remain decorative where the visible menu label supplies the action name.
- Keyboard activation, focus handling, and disabled behavior continue to come from the existing Radix dropdown primitives.

## Testing

Implementation follows test-driven development:

1. Add or update focused tests before production changes.
2. Capture failures showing inline action buttons or bespoke triggers still exist.
3. Convert the relevant feature table to `ActionMenu`.
4. Verify one trigger per actionable row and confirm each visible menu item invokes the original callback.
5. Cover status-dependent and permission-dependent visibility for receipts and materials receiving.
6. Cover row-click isolation and responsive trigger classes in the shared component or focused feature tests.
7. Run the affected unit suites, scoped lint/format checks, and responsive browser checks for representative desktop and mobile table views.

## Acceptance Criteria

- Every list-table action column displays only one three-dot trigger per actionable row.
- “กำหนดแผนก” is inside the permissions row menu.
- No existing user action disappears or becomes available under a status/permission where it was previously unavailable.
- Menu actions still execute the same callbacks, navigation, and confirmation flows.
- Mobile action triggers remain easy to tap and no menu causes horizontal document overflow.
- Focused tests and responsive checks pass with no new errors.

## Out of Scope

- Adding row actions to detail-only tables.
- Redesigning filters, pagination, cards, dialogs, or table content.
- Changing business rules, permissions, API endpoints, or backend code.
