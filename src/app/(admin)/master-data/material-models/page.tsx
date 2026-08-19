/**
 * Material Models Page
 * 
 * Thin wrapper page that uses MaterialModelListContainer for business logic.
 * Following Container/Presenter pattern from @/lib/patterns.ts
 */

import { PermissionGuard } from "@/components/ui/permission-guard";
import { MaterialModelListContainer } from "@/features/material-models/components/material-model-list.container";

export default function MaterialModelsPage() {
  return (
    <PermissionGuard permission="MATERIAL_MODEL_VIEW">
      <MaterialModelListContainer />
    </PermissionGuard>
  );
}
