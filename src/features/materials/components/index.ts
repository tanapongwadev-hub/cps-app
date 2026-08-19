/**
 * Materials Components - Barrel Export
 * 
 * Centralized exports for materials feature components.
 * Following Vercel Best Practices for clean imports.
 */

// Presentational Components (for use outside feature)
export { MaterialsListPresenter } from "./materials-list.presenter";

// Container Components (for use in pages)
export { MaterialsListContainer } from "./materials-list.container";

// Sub-components
export { MaterialTable } from "./material-table";
export { MaterialCardGrid } from "./material-card-grid";
export { MaterialFilters } from "./material-filters";
export { MaterialFormDialog } from "./material-form-dialog";
export { MaterialStatusDialog } from "./material-status-dialog";
