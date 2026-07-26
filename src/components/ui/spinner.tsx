"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg" | "xl";
}

export function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3 border",
    default: "h-4 w-4 border-2",
    lg: "h-6 w-6 border-2",
    xl: "h-10 w-10 border-4",
  };
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-primary",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export function LoadingOverlay({ className, message }: { className?: string; message?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
