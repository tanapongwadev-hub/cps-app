"use client";

import * as React from "react";
import { HelpCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BaseFieldProps {
  label?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

interface TextFieldProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  type?: "text" | "email" | "tel" | "url" | "password" | "search" | "number";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      description,
      tooltip,
      required,
      optional,
      error,
      className,
      containerClassName,
      disabled,
      readOnly,
      type = "text",
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <div className="flex items-center gap-1.5">
            <Label htmlFor={fieldId} className="text-sm">
              {label}
              {required && <span className="text-danger ml-0.5">*</span>}
              {optional && <span className="text-muted-foreground ml-1 text-xs">(ไม่บังคับ)</span>}
            </Label>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`คำอธิบาย: ${tooltip}`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
              {leftIcon}
            </div>
          )}
          <Input
            id={fieldId}
            ref={ref}
            type={inputType}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : description ? `${fieldId}-desc` : undefined}
            className={cn(
              leftIcon && "pl-9",
              (rightIcon || isPassword) && "pr-9",
              error && "border-danger focus-visible:ring-danger/20",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
              {rightIcon}
            </div>
          )}
        </div>
        {description && !error && (
          <p id={`${fieldId}-desc`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="flex items-center gap-1 text-xs text-danger">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextField.displayName = "TextField";

interface TextAreaFieldProps extends BaseFieldProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, description, tooltip, required, optional, error, className, containerClassName, id, ...props }, ref) => {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <div className="flex items-center gap-1.5">
            <Label htmlFor={fieldId}>
              {label}
              {required && <span className="text-danger ml-0.5">*</span>}
              {optional && <span className="text-muted-foreground ml-1 text-xs">(ไม่บังคับ)</span>}
            </Label>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        <Textarea
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(error && "border-danger focus-visible:ring-danger/20", className)}
          {...props}
        />
        {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
        {error && (
          <p className="flex items-center gap-1 text-xs text-danger">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextAreaField.displayName = "TextAreaField";

interface SelectFieldProps extends BaseFieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  containerClassName?: string;
}

export function SelectField({
  label,
  description,
  tooltip,
  required,
  optional,
  error,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "เลือก...",
  disabled,
  containerClassName,
}: SelectFieldProps) {
  const reactId = React.useId();
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <div className="flex items-center gap-1.5">
          <Label htmlFor={reactId}>
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
            {optional && <span className="text-muted-foreground ml-1 text-xs">(ไม่บังคับ)</span>}
          </Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      <Select value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={reactId} error={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  containerClassName?: string;
}

export function CheckboxField({
  label,
  description,
  error,
  checked,
  onCheckedChange,
  disabled,
  containerClassName,
}: CheckboxFieldProps) {
  const reactId = React.useId();
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      <div className="flex items-start gap-2">
        <Checkbox
          id={reactId}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange?.(!!v)}
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label htmlFor={reactId} className="font-normal cursor-pointer">
            {label}
          </Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

interface RadioFieldProps extends BaseFieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  containerClassName?: string;
}

export function RadioField({
  label,
  description,
  required,
  error,
  value,
  onValueChange,
  options,
  disabled,
  containerClassName,
}: RadioFieldProps) {
  const reactId = React.useId();
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </Label>
      )}
      <RadioGroup value={value} onValueChange={onValueChange} disabled={disabled} className="gap-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-start gap-2">
            <RadioGroupItem value={opt.value} id={`${reactId}-${opt.value}`} className="mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor={`${reactId}-${opt.value}`} className="font-normal cursor-pointer">
                {opt.label}
              </Label>
              {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
            </div>
          </div>
        ))}
      </RadioGroup>
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

interface SwitchFieldProps extends BaseFieldProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  containerClassName?: string;
}

export function SwitchField({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  containerClassName,
}: SwitchFieldProps) {
  const reactId = React.useId();
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 p-3">
        <div className="space-y-0.5">
          <Label htmlFor={reactId} className="cursor-pointer">
            {label}
          </Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Switch
          id={reactId}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// Re-export DatePicker / DateRangePicker
export { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
