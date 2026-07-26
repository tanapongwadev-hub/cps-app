"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 border-b pb-5", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {(primaryAction || secondaryActions) && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageContainer({ children, className, contentClassName }: PageContainerProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className={cn("flex-1 space-y-5 p-4 sm:p-6 lg:p-8", contentClassName)}>{children}</div>
    </div>
  );
}

interface PageFooterProps {
  children?: React.ReactNode;
}

export function PageFooter({ children }: PageFooterProps) {
  return (
    <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
      {children ?? "© 2024 Admin Template · Enterprise v1.0.0"}
    </footer>
  );
}
