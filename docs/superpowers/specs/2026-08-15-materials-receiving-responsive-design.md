# Materials Receiving Responsive Design

## Goal

Make `/materials/materials-receiving` usable from mobile through desktop without changing API contracts, permissions, validation, or receiving business rules.

The responsive work covers the page header, filters, receiving list, pagination, create/edit form, detail view, and confirmation dialogs.

## Breakpoints

- Mobile: widths below `768px`.
- Tablet and desktop: widths from `768px` upward.
- Existing `sm` breakpoints may still be used inside dialogs where two compact controls can safely share a row, but the primary list switches between cards and table at `md` (`768px`).

## Page Header and Actions

On mobile, the page title and description wrap naturally. Refresh and create actions stack below the heading and use the available width so neither label is clipped. At `md` and above, the existing horizontal header and compact buttons remain.

## Filters

Search and status remain immediately available because they are the most-used filters. Secondary filters remain inside the existing collapsible advanced-filter section on mobile. All controls use the full available width below `sm`, dates stack vertically, and long option labels must not expand the page width.

At `md` and above, filters continue to use the current wrapped row layout.

## Receiving List

### Mobile card view

Below `768px`, each receiving is rendered as a card. A card exposes the same operational information as the desktop row:

- Internal Lot No. and status as the primary identity.
- Receive date.
- Supplier.
- Material code and name.
- Received quantity.
- Package count.
- Supplier Lot No.

Long lot numbers, supplier names, and material names wrap or truncate within the card without causing document-level horizontal overflow.

Row actions are preserved in the existing overflow menu. View remains the first action, with edit, confirm, cancel, and delete shown according to the same status and permission conditions as the table.

### Desktop table view

At `768px` and above, the existing sortable table remains. Sorting behavior and column content do not change. The card and table are alternative presentations of the same data and callbacks, not separate business implementations.

### Loading, empty, and error states

Mobile loading uses card-shaped skeletons. Empty and error states remain shared across breakpoints and retain retry/create actions. No state should force a fixed minimum document width.

## Pagination

On mobile, the result summary, page-size control, and previous/next controls stack with adequate touch targets. At `sm` or `md` and above, they return to a compact horizontal layout. Page and page-size callbacks remain unchanged.

## Create and Edit Form

On mobile, the form dialog behaves as a near-full-screen work surface:

- Width is constrained to the viewport and height is limited to the visible viewport.
- Content scrolls vertically inside the dialog.
- Padding is reduced from the desktop value.
- Form grids collapse to one column.
- Lot previews, calculated values, attachment names, and package summaries wrap inside their containers.
- Header content remains readable without overlapping the close button.
- Cancel and save actions sit in a sticky footer and use full-width buttons.

At larger breakpoints, the existing centered `max-w-4xl` dialog and multi-column form layout remain.

The existing supplier-loading and form-reset changes in the working tree must be preserved. Responsive changes must not alter form data flow, validation, attachment behavior, or payload construction.

## Detail Dialog

On mobile, the detail dialog uses the same near-full-screen shell. Summary cards, document information, QR content, package cards, and audit information render in one column. QR images scale down within their containers. Long identifiers use safe wrapping.

Detail actions stack as full-width buttons on mobile and return to a right-aligned row on larger screens. Visibility and enabled states continue to depend on receiving status and the callbacks supplied by the page.

## Confirmation Dialogs

Confirmation dialogs keep their current semantic structure and variants. On mobile they use viewport-safe width and reduced padding, while cancel/confirm actions stack at full width. The cancellation-reason textarea remains full width and must not be obscured by the on-screen keyboard or action area.

## Accessibility and Interaction

- Interactive controls retain visible keyboard focus.
- Mobile controls provide practical touch targets.
- Card actions have accessible names equivalent to table actions.
- Collapsible filters retain `aria-expanded` state.
- Dialog content remains keyboard reachable and vertically scrollable.
- Responsive presentation does not duplicate visible interactive content at the same breakpoint.

## Testing Strategy

### Component tests

- Verify that the receiving list includes distinct mobile-card and desktop-table presentations.
- Verify that callbacks and status-dependent actions remain available in the card view.
- Verify loading, empty, error, and pagination presentations.
- Extend form and detail tests for the responsive shell and mobile-safe layout classes where behavior can be asserted reliably.

### Browser tests

Validate the complete page at:

- `390x844` for mobile.
- `768x1024` for the card/table boundary and tablet layout.
- `1280x720` for desktop regression coverage.

At each relevant size, assert that the document has no horizontal overflow. On mobile, exercise advanced filters, the create/edit form, detail view, row actions, and confirmation dialogs. Confirm that sticky actions remain usable and that long sample values remain inside their containers.

## Non-goals

- No backend or API changes.
- No changes to receiving calculations, statuses, permissions, validation, or mutation behavior.
- No redesign of the global admin shell or sidebar.
- No unrelated visual refresh or shared-dialog refactor beyond what is necessary for this page's viewport safety.

## Acceptance Criteria

1. The page is usable without document-level horizontal scrolling at the three target viewport sizes.
2. Mobile users see receiving cards; users at `768px` and above see the sortable table.
3. All receiving information and permitted actions available in the table remain available in the card view.
4. Filters, pagination, form, detail, and confirmation dialogs fit the mobile viewport and remain operable.
5. Desktop behavior and API/business behavior remain unchanged.
6. Existing user changes in `materials-receiving-form-dialog.tsx` are preserved.
7. Focused component, type-check, and responsive browser tests pass.
