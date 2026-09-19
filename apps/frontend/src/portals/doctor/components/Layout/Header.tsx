import { ROUTES } from '@/shared/constants/routes';
import { Link } from 'react-router-dom';
import { Badge, Button, Icon, SealMark, useTheme } from '@pramana/ui-components';
import { useAuth } from '../../features/auth/useAuth';

/**
 * SS1.1: oxblood appears here exactly once, in the logomark. Nothing else in
 * this header may carry it.
 */
export function Header({ onOpenNav }: { onOpenNav?: () => void }) {
  const { doctor, signingUnlocked, lockSigning, signOut } = useAuth();
  const { resolved, setTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 border-b border-line-2 bg-canvas/90 px-4 py-2 backdrop-blur-[10px]"
    >
      {onOpenNav ? (
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="inline-flex size-touch items-center justify-center rounded-control text-ink-3 hover:bg-canvas-2 lg:hidden"
        >
          <Icon name="list" />
        </button>
      ) : null}

      <Link to={ROUTES.doctor.root} className="flex min-h-touch items-center gap-3 no-underline">
        <SealMark size={26} />
        <span className="font-document text-title-sm font-semibold">Pramāṇa</span>
        <span className="hidden border-l border-line pl-3 text-caption text-muted sm:inline">
          Doctor portal
        </span>
      </Link>

      <div className="flex-1" />

      {doctor?.is_suspended ? <Badge status="suspended" /> : null}

      {signingUnlocked ? (
        <Button size="sm" variant="ghost" icon="lock" onClick={lockSigning}>
          <span className="max-sm:sr-only">Lock signing key</span>
        </Button>
      ) : null}

      <button
        type="button"
        onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
        aria-label={resolved === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
        className="inline-flex size-touch items-center justify-center rounded-control text-ink-3 hover:bg-canvas-2"
      >
        <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
      </button>

      <Button size="sm" variant="ghost" icon="logout" onClick={signOut}>
        <span className="max-sm:sr-only">Sign out</span>
      </Button>
    </header>
  );
}
