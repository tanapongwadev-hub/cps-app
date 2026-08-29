# Product Display Alignment Design

## Objective

Align the `/products` card and table presentation with the established `/materials` visual language while preserving Product CRUD, BOM navigation, and status actions.

## Approved design

- Cards use an image-first 4:3 layout with a no-image fallback and image preview.
- Product type, status, and unit remain visible as compact badges.
- Product-specific details include code, name, model, customer, location, lot, packing, safety stock, and minimum stock.
- Tables lead with a product thumbnail and compact identity block, followed by Product-specific operational data.
- Loading, empty, error, pagination, responsive layout, and action-menu treatment follow `/materials`.
- Pagination sizes are `10`, `25`, `50`, and `100`.
- Existing callbacks and API behavior remain unchanged.

## Visual direction

Use the current application tokens, typography, and component library. The signature element is the product image as the catalog anchor; all surrounding styling stays quiet and consistent with Materials.
