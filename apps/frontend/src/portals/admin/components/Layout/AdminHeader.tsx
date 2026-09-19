import { ROUTES } from '@/shared/constants/routes';
import { Link, NavLink } from 'react-router-dom';
import { Badge, Button, Icon, SealMark, cn, useTheme, type IconName } from '@pramana/ui-components';

/**
 * SS6: this app is used almost entirely above 1024px, so navigation lives in
 * the header rather than a rail - but it still collapses to a scrollable strip
 * rather than a hamburger, because an admin on a tablet at a desk should not
 * have to open a menu to move between queues.
 */
const NAV: Array<{ to: string; label: string; icon: IconName }> = [
  { to: ROUTES.admin.dashboard, label: 'Overview', icon: 'gauge' },
  { to: ROUTES.admin.flagged, label: 'Flagged', icon: 'flag' },
  { to: ROUTES.admin.doctors, label: 'Doctors', icon: 'user' },
  { to: ROUTES.admin.pharmacies, label: 'Pharmacies', icon: 'store' },
  { to: ROUTES.admin.patientFlags, label: 'Patient flags', icon: 'users' },
  { to: ROUTES.admin.ledger, label: 'Ledger', icon: 'hash' },
  { to: ROUTES.admin.audit, label: 'Audit log', icon: 'list' },
];

export function AdminHeader({
  adminName, keyUnlocked, onLockKey,
}: {
  adminName: string | null;
  keyUnlocked: boolean;
  onLockKey: () => void;
}) {
  const { resolved, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex flex-col border-b border-line-2 bg-canvas/90 backdrop-blur-[10px]">
      <div className="flex items-center gap-3 px-4 py-2">
        <Link to={ROUTES.admin.dashboard} className="flex min-h-touch items-center gap-3 no-underline">
          <SealMark size={26} />
          <span className="font-document text-title-sm font-semibold">Pramāṇa</span>
          <span className="hidden border-l border-line pl-3 text-caption text-muted sm:inline">
            Platform admin
          </span>
        </Link>

        <div className="flex-1" />

        {keyUnlocked ? (
          <>
            <Badge status="verified" label="Signing key unlocked" />
            <Button size="sm" variant="ghost" icon="lock" onClick={onLockKey}>
              <span className="max-sm:sr-only">Lock</span>
            </Button>
          </>
        ) : (
          <Link to={ROUTES.admin.settingsKey} className="no-underline">
            <Badge status="pending" label="Signing key locked" />
          </Link>
        )}

        <button
          type="button"
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          aria-label={resolved === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
          className="inline-flex size-touch items-center justify-center rounded-control text-ink-3 hover:bg-canvas-2"
        >
          <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
        </button>

        {adminName ? <span className="hidden text-caption text-muted lg:inline">{adminName}</span> : null}
      </div>

      <nav aria-label="Admin sections" className="scroll-none flex gap-1 overflow-x-auto px-3 pb-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex min-h-[38px] shrink-0 items-center gap-2 rounded-control px-3 text-body-sm font-medium no-underline',
                'transition-colors duration-instant ease-out',
                isActive ? 'bg-seal-wash text-seal' : 'text-ink-3 hover:bg-canvas-2 hover:text-ink',
              )
            }
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
