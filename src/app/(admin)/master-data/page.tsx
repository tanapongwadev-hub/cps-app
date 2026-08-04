"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Building, FolderTree, MapPin, Ruler, Tag, Truck, Wrench, ChevronRight } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface MasterCard {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const cards: MasterCard[] = [
  {
    key: "units",
    title: "หน่วยนับ",
    description: "จัดการหน่วยนับ เช่น ชิ้น กิโลกรัม เมตร",
    href: "/master-data/units",
    icon: Ruler,
  },
  {
    key: "suppliers",
    title: "ผู้จัดจำหน่าย",
    description: "จัดการข้อมูลผู้จัดจำหน่าย/Supplier",
    href: "/master-data/suppliers",
    icon: Truck,
  },
  {
    key: "material-models",
    title: "รุ่นวัสดุ",
    description: "จัดการรุ่น/Model ของวัสดุ",
    href: "/master-data/material-models",
    icon: Wrench,
  },
  {
    key: "delivery-types",
    title: "ประเภทการจัดส่ง",
    description: "จัดการประเภทการจัดส่ง เช่น ด่วน ปกติ",
    href: "/master-data/delivery-types",
    icon: Truck,
  },
  {
    key: "loading-points",
    title: "จุดขนถ่าย",
    description: "จัดการจุดขนถ่าย/Loading Point",
    href: "/master-data/loading-points",
    icon: MapPin,
  },
  {
    key: "categories",
    title: "หมวดหมู่",
    description: "จัดการหมวดหมู่/Category",
    href: "/master-data/categories",
    icon: FolderTree,
  },
  {
    key: "statuses",
    title: "สถานะ",
    description: "จัดการสถานะ/Status Item",
    href: "/master-data/statuses",
    icon: Tag,
  },
  {
    key: "organizations",
    title: "องค์กร",
    description: "จัดการข้อมูลองค์กรและสาขา",
    href: "/master-data/organizations",
    icon: Building,
  },
];

export default function MasterDataIndexPage() {
  return (
    <>
      <PageContainer>
        <PageHeader
          title="ข้อมูลหลัก"
          description="เลือกประเภทข้อมูลหลักที่ต้องการจัดการ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.key}
                href={c.href}
                className="group block focus:outline-none"
              >
                <Card className="flex h-full items-center gap-4 p-5 transition-colors hover:border-primary/40 hover:bg-accent/50">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">{c.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      "group-hover:translate-x-0.5 group-hover:text-primary",
                    )}
                  />
                </Card>
              </Link>
            );
          })}
        </div>
      </PageContainer>

      <PageFooter />
    </>
  );
}
