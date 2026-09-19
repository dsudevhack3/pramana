import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { Button } from '../Button/Button';

/**
 * SS5: fixed-length digit input - auto-advance, paste-aware, visible blinking
 * caret, resend timer that stays disabled until it elapses.
 *
 * Used identically everywhere an OTP appears in the workflow: Aadhaar eKYC in
 * Flow 1, patient identity binding in Flow 2, pharmacist login in Flow 0.5.
 * It does not know or care what is being verified.
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  resendSeconds = 30,
  disabled = false,
  label = 'One-time password',
  error,
  autoFocus = true,
}: {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  onResend?: () => void | Promise<void>;
  resendSeconds?: number;
  disabled?: boolean;
  label?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [secondsLeft, setSecondsLeft] = useState(onResend ? resendSeconds : 0);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  function write(next: string) {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = digit || ' ';
    write(chars.join('').trimEnd().replace(/ /g, ''));
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !value[index] && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    write(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  async function resend() {
    await onResend?.();
    setSecondsLeft(resendSeconds);
    onChange('');
    refs.current[0]?.focus();
  }

  return (
    <div className="flex max-w-field flex-col gap-3">
      <fieldset className="flex flex-col gap-2 border-0 p-0" disabled={disabled}>
        <legend className="mb-2 text-body-sm font-semibold">{label}</legend>
        <div className="flex gap-2" onPaste={handlePaste}>
          {Array.from({ length }).map((_, i) => (
            <input
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={value[i] ?? ''}
              aria-label={`Digit ${i + 1} of ${length}`}
              aria-invalid={Boolean(error) || undefined}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                'h-[54px] w-[clamp(38px,11vw,48px)] rounded-control border bg-surface text-center',
                'font-mono text-title-sm caret-seal',
                error ? 'border-scarlet bg-scarlet-wash' : 'border-line',
                'focus:border-seal-light',
              )}
            />
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-caption text-scarlet">{error}</p>
      ) : null}

      {onResend ? (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" disabled={secondsLeft > 0} onClick={resend}>
            Send a new code
          </Button>
          {secondsLeft > 0 ? (
            <span className="text-caption text-muted">
              You can request another in {secondsLeft}s
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
