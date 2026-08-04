"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export function LoadingPointFilters({ value, onChange }: {
  value: { search: string; isActive?: boolean };
  onChange: (v: { search: string; isActive?: boolean }) => void;
}) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหารหัสหรือชื่อ" value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })} className="pl-9" />
        </div>
        <Select
          value={value.isActive === undefined ? "all" : value.isActive ? "active" : "inactive"}
          onValueChange={(v) => onChange({ ...value, isActive: v === "all" ? undefined : v === "active" })}
        >
          <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="active">ใช้งาน</SelectItem>
            <SelectItem value="inactive">ระงับ</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
