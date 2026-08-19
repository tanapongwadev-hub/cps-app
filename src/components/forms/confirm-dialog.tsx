"use client";

import * as React from "react";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  hideCancel?: boolean;
  showTextInput?: boolean;
  textInputLabel?: string;
  textInputValue?: string;
  onTextInputChange?: (value: string) => void;
  textInputRequired?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "danger",
  loading,
  onConfirm,
  hideCancel,
  showTextInput,
  textInputLabel,
  textInputValue,
  onTextInputChange,
  textInputRequired,
}: ConfirmDialogProps) {
  const icons = {
    danger: <AlertTriangle className="h-6 w-6" />,
    warning: <AlertTriangle className="h-6 w-6" />,
    info: <Info className="h-6 w-6" />,
    success: <CheckCircle2 className="h-6 w-6" />,
  };
  const colors = {
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
  };
  const btnVariants = {
    danger: "destructive" as const,
    warning: "default" as const,
    info: "default" as const,
    success: "default" as const,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        hideClose={loading}
        className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] p-4 sm:p-6"
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                colors[variant],
              )}
            >
              {icons[variant]}
            </div>
            <div className="min-w-0 space-y-1.5 break-words">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription asChild>
                  <div className="text-muted-foreground min-w-0 text-sm break-words">
                    {description}
                  </div>
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {showTextInput && (
          <div className="space-y-2">
            <Label htmlFor="dialog-text-input" className="text-sm font-medium">
              {textInputLabel ?? ""}
              {textInputRequired && <span className="text-danger ml-1">*</span>}
            </Label>
            <Textarea
              id="dialog-text-input"
              value={textInputValue}
              onChange={(e) => onTextInputChange?.(e.target.value)}
              rows={3}
              placeholder={`กรุณากรอก${textInputLabel ?? ""}`}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:space-x-0">
          {!hideCancel && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={btnVariants[variant]}
            onClick={onConfirm}
            loading={loading}
            autoFocus
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Convenience hook
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    open: boolean;
    props: Omit<ConfirmDialogProps, "open" | "onOpenChange">;
  }>({ open: false, props: {} as never });

  const open = React.useCallback((props: Omit<ConfirmDialogProps, "open" | "onOpenChange">) => {
    setState({ open: true, props });
  }, []);

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const dialog = (
    <ConfirmDialog
      {...state.props}
      open={state.open}
      onOpenChange={(o) => (o ? setState((s) => ({ ...s, open: true })) : close())}
    />
  );

  return { open, close, dialog };
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading,
  warning,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  warning?: string;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`ยืนยันการลบ "${itemName}"?`}
      confirmText="ลบ"
      cancelText="ยกเลิก"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
      description={
        <div className="space-y-2">
          <p>การลบข้อมูลนี้ไม่สามารถกู้คืนได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ</p>
          {warning && (
            <div className="bg-warning/10 text-warning flex items-start gap-2 rounded-md p-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{warning}</span>
            </div>
          )}
        </div>
      }
    />
  );
}

export function XCircle_({ className }: { className?: string }) {
  return <XCircle className={className} />;
}
