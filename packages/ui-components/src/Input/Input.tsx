import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { Icon } from '../Icon/Icon';

/**
 * SS6: form fields cap at 560px regardless of viewport. A field stretching to
 * 1400px is treated as a defect, not a stylistic choice - the cap lives in
 * <Field> so no screen has to remember it.
 *
 * SS8: every field has a properly associated <label>; validation errors are
 * linked through aria-describedby, not left as loose red text.
 */
export interface FieldProps {
  label: string;
  htmlFor?: string;
  /** Rendered under the control, and linked via aria-describedby. */
  help?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /** Opt out of the 560px cap only for a genuinely full-width control. */
  unbounded?: boolean;
}

export function Field({
  label, htmlFor, help, error, required, children, className, unbounded,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', !unbounded && 'max-w-field', className)}>
      <label htmlFor={htmlFor} className="text-body-sm font-semibold">
        {label}
        {required ? <span className="text-muted"> (required)</span> : null}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-2 text-caption text-scarlet">
          <Icon name="alertTriangle" size={14} />
          {error}
        </p>
      ) : help ? (
        <p className="text-caption text-muted">{help}</p>
      ) : null}
    </div>
  );
}

const CONTROL = cn(
  'w-full min-h-touch rounded-control border border-line bg-surface px-3 py-2',
  'text-ink placeholder:text-muted transition-colors duration-instant ease-out',
  'hover:border-ink-3 focus:border-seal-light',
  'aria-[invalid=true]:border-scarlet aria-[invalid=true]:bg-scarlet-wash',
  'disabled:opacity-[0.42] disabled:cursor-not-allowed',
);

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest }, ref,
) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(CONTROL, className)} {...rest} />;
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 3, ...rest }, ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'resize-y', className)}
      {...rest}
    />
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest }, ref,
) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={cn(CONTROL, 'pr-8', className)} {...rest}>
      {children}
    </select>
  );
});

/** Convenience wrapper that wires label, control and error message ids together. */
export function LabelledInput({
  label, help, error, required, unbounded, ...inputProps
}: Omit<FieldProps, 'children' | 'htmlFor'> & InputProps) {
  const id = useId();
  const describedBy = error || help ? `${id}-desc` : undefined;
  return (
    <Field label={label} htmlFor={id} help={help} error={error} required={required} unbounded={unbounded}>
      <Input id={id} aria-describedby={describedBy} invalid={Boolean(error)} {...inputProps} />
    </Field>
  );
}
