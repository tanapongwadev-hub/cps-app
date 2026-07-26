"use client";

import * as React from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/utils/format";

interface FileUploadProps {
  value?: File | File[] | null;
  onChange?: (files: File | File[] | null) => void;
  accept?: string;
  maxSize?: number; // bytes
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: boolean;
  preview?: boolean;
}

export function FileUpload({
  value,
  onChange,
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = false,
  disabled,
  className,
  placeholder = "คลิกหรือลากไฟล์มาวาง",
  error,
  preview,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const files = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const valid: File[] = [];
    for (const file of Array.from(list)) {
      if (file.size > maxSize) continue;
      valid.push(file);
    }
    if (multiple) onChange?.(valid);
    else onChange?.(valid[0] ?? null);
  };

  const remove = (idx: number) => {
    if (multiple) {
      const next = [...files];
      next.splice(idx, 1);
      onChange?.(next);
    } else {
      onChange?.(null);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-accent/30",
          dragOver && "border-primary bg-primary/5",
          error && "border-danger/50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{placeholder}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {accept ? `รองรับ: ${accept}` : "รองรับทุกประเภทไฟล์"} · สูงสุด {formatBytes(maxSize)}
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              {file.type.startsWith("image/") ? (
                preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-9 w-9 rounded object-cover"
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(idx);
                }}
                aria-label={`ลบไฟล์ ${file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
