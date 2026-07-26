"use client";

import * as React from "react";
import { Save, Building2, Globe, Bell, Shield, Palette, Database } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField, SwitchField } from "@/components/forms/form-field";
import { FormSection, FormGrid } from "@/components/forms/form-section";
import { showToast } from "@/lib/toast";

export default function SettingsPage() {
  return (
    <>
      <PageContainer>
        <PageHeader
          title="ตั้งค่าระบบ"
          description="จัดการการตั้งค่าทั่วไปของระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ระบบ" },
            { label: "ตั้งค่า" },
          ]}
        />

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              ทั่วไป
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              รูปลักษณ์
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              การแจ้งเตือน
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              ความปลอดภัย
            </TabsTrigger>
            <TabsTrigger value="integration" className="gap-1.5">
              <Database className="h-3.5 w-3.5" />
              เชื่อมต่อ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card className="p-5">
              <form onSubmit={(e) => { e.preventDefault(); showToast.success("บันทึกการตั้งค่าเรียบร้อย"); }} className="space-y-6">
                <FormSection title="ข้อมูลองค์กร">
                  <FormGrid cols={2}>
                    <TextField label="ชื่อองค์กร" defaultValue="บริษัท ตัวอย่าง จำกัด" />
                    <TextField label="ชื่อย่อ" defaultValue="EXM" />
                  </FormGrid>
                  <TextAreaField label="ที่อยู่" rows={2} defaultValue="123/4 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110" />
                  <FormGrid cols={3}>
                    <TextField label="เบอร์โทรศัพท์" defaultValue="02-123-4567" />
                    <TextField label="อีเมล" type="email" defaultValue="contact@example.com" />
                    <TextField label="เว็บไซต์" defaultValue="https://example.com" />
                  </FormGrid>
                </FormSection>

                <FormSection title="ภาษาและเขตเวลา">
                  <FormGrid cols={2}>
                    <SelectField
                      label="ภาษาเริ่มต้น"
                      defaultValue="th"
                      options={[
                        { value: "th", label: "ไทย" },
                        { value: "en", label: "English" },
                      ]}
                    />
                    <SelectField
                      label="เขตเวลา"
                      defaultValue="Asia/Bangkok"
                      options={[
                        { value: "Asia/Bangkok", label: "Asia/Bangkok (UTC+7)" },
                        { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
                        { value: "UTC", label: "UTC" },
                      ]}
                    />
                  </FormGrid>
                </FormSection>

                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="h-4 w-4" />
                    บันทึกการตั้งค่า
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-4">
            <Card className="p-5">
              <form onSubmit={(e) => { e.preventDefault(); showToast.success("บันทึกเรียบร้อย"); }} className="space-y-4">
                <FormSection title="ธีมและการแสดงผล">
                  <SwitchField label="เปิดใช้งาน Dark Mode" description="ผู้ใช้งานสามารถสลับโหมดได้" defaultChecked />
                  <SwitchField label="แสดง Sidebar ย่อ" description="ย่อ Sidebar เป็น Icon เท่านั้น" />
                  <SelectField
                    label="สีหลัก"
                    defaultValue="blue"
                    options={[
                      { value: "blue", label: "น้ำเงิน (Default)" },
                      { value: "green", label: "เขียว" },
                      { value: "purple", label: "ม่วง" },
                      { value: "red", label: "แดง" },
                    ]}
                  />
                </FormSection>
                <div className="flex justify-end">
                  <Button type="submit"><Save className="h-4 w-4" />บันทึก</Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card className="p-5">
              <form onSubmit={(e) => { e.preventDefault(); showToast.success("บันทึกเรียบร้อย"); }} className="space-y-4">
                <FormSection title="การแจ้งเตือน">
                  <SwitchField label="แจ้งเตือนทางอีเมล" description="รับการแจ้งเตือนผ่านอีเมล" defaultChecked />
                  <SwitchField label="แจ้งเตือนทาง SMS" description="รับการแจ้งเตือนผ่าน SMS" />
                  <SwitchField label="แจ้งเตือนบนหน้าจอ" description="แสดงการแจ้งเตือนแบบ real-time" defaultChecked />
                </FormSection>
                <div className="flex justify-end">
                  <Button type="submit"><Save className="h-4 w-4" />บันทึก</Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card className="p-5">
              <form onSubmit={(e) => { e.preventDefault(); showToast.success("บันทึกเรียบร้อย"); }} className="space-y-4">
                <FormSection title="ความปลอดภัย">
                  <SwitchField label="Two-Factor Authentication" description="บังคับใช้ 2FA สำหรับผู้ใช้งานทุกคน" />
                  <SwitchField label="Session Timeout" description="หมดเวลาอัตโนมัติหลังไม่มีการใช้งาน" defaultChecked />
                  <TextField label="Session Timeout (นาที)" type="number" defaultValue="60" />
                  <SelectField
                    label="Password Policy"
                    defaultValue="strong"
                    options={[
                      { value: "basic", label: "พื้นฐาน (8+ ตัวอักษร)" },
                      { value: "strong", label: "เข้มงวด (8+ ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวเลข อักษรพิเศษ)" },
                    ]}
                  />
                </FormSection>
                <div className="flex justify-end">
                  <Button type="submit"><Save className="h-4 w-4" />บันทึก</Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="mt-4">
            <Card className="p-5">
              <div className="space-y-3">
                <IntegrationRow title="Email Service" description="SMTP สำหรับส่งอีเมล" status="connected" />
                <IntegrationRow title="SMS Provider" description="ผู้ให้บริการ SMS" status="disconnected" />
                <IntegrationRow title="File Storage" description="จัดเก็บไฟล์บน S3" status="connected" />
                <IntegrationRow title="Single Sign-On (SSO)" description="เชื่อมต่อ SAML / OAuth" status="disconnected" />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
      <PageFooter />
    </>
  );
}

function IntegrationRow({ title, description, status }: { title: string; description: string; status: "connected" | "disconnected" }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Button variant="outline" size="sm">
          {status === "connected" ? "ตั้งค่า" : "เชื่อมต่อ"}
        </Button>
      </div>
    </div>
  );
}
