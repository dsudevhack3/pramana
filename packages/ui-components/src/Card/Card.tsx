import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * SS3: cards are separated from their background by a 1px --line border, not by
 * elevation. No box-shadow on cards, list rows or panels - the single shadow
 * token exists only for raised primary actions.
 *
 * `bleed` is the SS6 sub-640px behaviour: cards go full-bleed on a phone.
 */
export function Card({
  children, className, bleed = false, as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
  as?: 'section' | 'div' | 'article' | 'li';
}) {
  return (
    <Tag
      className={cn(
        '@container bg-surface border border-line rounded-card',
        bleed && 'max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title, description, actions, className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-line-2 p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-title-sm">{title}</h3>
        {description ? <p className="max-w-measure text-body-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}
