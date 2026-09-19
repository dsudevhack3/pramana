import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@pramana/ui-components';

/**
 * A portal entry. It is a real <Link>, so navigation stays inside this
 * application (no full reload), middle-click and "open in new tab" work, and a
 * screen reader announces it as a link with its full description.
 */
export function PortalCard({
  to, title, description, icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: IconName;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-touch flex-1 flex-col gap-3 rounded-card border border-line bg-surface p-5 no-underline transition-colors duration-instant ease-out hover:bg-canvas-2"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span aria-hidden className="inline-flex size-touch items-center justify-center rounded-control bg-canvas-2 text-ink">
            <Icon name={icon} size={22} />
          </span>
          <span className="font-document text-title-sm font-semibold text-ink">{title}</span>
        </span>
        <Icon name="chevronRight" size={18} className="text-muted" />
      </span>
      <span className="max-w-measure text-body-sm text-muted">{description}</span>
    </Link>
  );
}
