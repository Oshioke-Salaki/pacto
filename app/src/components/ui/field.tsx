import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[var(--r-input)] border border-line-2 bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-surface-2 disabled:text-ink-3";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  right,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
        {right ? <span className="text-xs text-ink-3">{right}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-11", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-28 py-2.5 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, "h-11 appearance-none bg-no-repeat pr-9", className)} {...rest}>
      {children}
    </select>
  );
}

export function InputAdornment({ children, ...rest }: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <div className="relative">
      <input className={cn(control, "h-11 pr-16")} {...rest} />
      <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-3">{children}</span>
    </div>
  );
}
