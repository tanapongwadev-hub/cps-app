/**
 * Permissions page
 *
 * Two views driven by the real backend:
 *   1) "สิทธิ์ของฉัน" — the effective permissions from the current session
 *   2) "แคตตาล็อกสิทธิ์" — full permission list fetched from GET /permissions
 */
"use client";

import { Key, ShieldCheck } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { usePermission } from "@/hooks/use-permission";
import { MyPermissionsCard } from "@/features/permissions/components/my-permissions-card";
import { PermissionCatalog } from "@/features/permissions/components/permission-catalog";

export default function PermissionsPage() {
  const user = useAuthStore((s) => s.user);
  const superAdmin = usePermission();

  return (
    <PageContainer>
      <PageHeader
        title="จัดการสิทธิ์"
        description="ดูสิทธิ์ที่ใช้งานได้ และแคตตาล็อกสิทธิ์ทั้งหมดในระบบ"
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/dashboard" },
          { label: "ระบบ" },
          { label: "จัดการสิทธิ์" },
        ]}
      />

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            สิทธิ์ของฉัน ({superAdmin.permissions.length})
          </TabsTrigger>
          {superAdmin.isSuperAdmin() && (
            <TabsTrigger value="catalog" className="gap-1.5">
              <Key className="h-3.5 w-3.5" />
              แคตตาล็อกสิทธิ์
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mine" className="mt-4 space-y-4">
          <MyPermissionsCard
            userName={user?.displayName || user?.username}
            isSuperAdmin={superAdmin.isSuperAdmin()}
            permissions={superAdmin.permissions}
          />
        </TabsContent>

        {superAdmin.isSuperAdmin() && (
          <TabsContent value="catalog" className="mt-4">
            <PermissionCatalog />
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}
