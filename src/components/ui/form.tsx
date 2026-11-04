import * as React from 'react';
import { cn } from '@/lib/utils';

const field = 'flex h-10 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-[invalid=true]:border-danger';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, className)} {...p} />
));
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(field, 'appearance-none [background-size:16px] [background-position:right_0.75rem_center] [background-repeat:no-repeat] pr-9 [&>option]:bg-card [&>option]:text-foreground', className)}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a08a5a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...p} />
));
Select.displayName = 'Select';

export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-sm font-medium leading-none', className)} {...p} />
);

export function Field({ label, htmlFor, hint, error, required, children, className }: {
  label: string; htmlFor?: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}{required && <span className="text-danger"> *</span>}</Label>
      {children}
      {error ? <p className="text-xs text-danger" role="alert">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ id, checked, onChange, label, className }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2 text-sm', className)}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
      <span>{label}</span>
    </label>
  );
}

export function ChipGroup<T extends string>({ options, value, onChange, multi = false }: {
  options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role={multi ? 'group' : 'radiogroup'}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button type="button" key={o.value} aria-pressed={on}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o.value) : [...value, o.value]) : [o.value])}
            className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors', on ? 'border-gold bg-gold/20 font-medium' : 'border-border hover:border-gold/60')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
