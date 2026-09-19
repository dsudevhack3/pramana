import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Icon, type IconName } from '../Icon/Icon';

/**
 * SS1.2: primary buttons are ink, not oxblood. A maroon primary button reads as
 * a destructive or warning action in a clinical product.
 *
 * SS1.1: the `seal` variant is reserved for the ONE action in the whole product
 * that deserves that gravity - signing. It is enforced at the type level below
 * (`SealButtonProps` demands `sealJustification`), not left to a code comment.
 */
export type ButtonVariant = 'ink' | 'seal' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode;
  size?: ButtonSize;
  loading?: boolean;
  /** Replaces the label while loading. The label swaps; there is no sibling spinner. */
  loadingLabel?: string;
  fullWidth?: boolean;
  icon?: IconName;
  iconPosition?: 'leading' | 'trailing';
  className?: string;
}

interface StandardButtonProps extends BaseProps {
  variant?: Exclude<ButtonVariant, 'seal'>;
  sealJustification?: never;
}

interface SealButtonProps extends BaseProps {
  variant: 'seal';
  /**
   * Required on the seal variant. Name the signing or sealing action this
   * button commits, so a reviewer can see at a glance that oxblood is earning
   * its place. A second seal button in one viewport is a defect.
   */
  sealJustification: 'sign-prescription' | 'sign-admin-action' | 'generate-signing-key';
}

export type ButtonProps = StandardButtonProps | SealButtonProps;

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-touch px-3 text-body-sm rounded-control',
  md: 'min-h-touch px-5 text-body rounded-button',
  lg: 'min-h-[52px] px-6 text-title-sm rounded-button',
};

const VARIANT: Record<ButtonVariant, string> = {
  ink: 'bg-ink text-canvas border-transparent hover:bg-ink-2',
  seal: 'bg-seal text-qr-white border-transparent shadow-primary hover:bg-seal-light',
  ghost: 'bg-transparent text-ink border-line hover:bg-canvas-2',
  destructive: 'bg-transparent text-scarlet border-scarlet hover:bg-scarlet-wash',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'ink',
    size = 'md',
    loading = false,
    loadingLabel,
    fullWidth = false,
    icon,
    iconPosition = 'leading',
    className,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const glyph = icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-ui font-semibold',
        'transition-[background-color,transform] duration-instant ease-out',
        'active:scale-[0.98] disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:active:scale-100',
        SIZE[size],
        VARIANT[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <span
            aria-hidden
            className="spin size-4 rounded-full border-2 border-current border-r-transparent"
          />
          <span>{loadingLabel ?? 'Working'}</span>
        </>
      ) : (
        <>
          {iconPosition === 'leading' && glyph}
          <span>{children}</span>
          {iconPosition === 'trailing' && glyph}
        </>
      )}
    </button>
  );
});
