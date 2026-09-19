import { ROUTES } from '@/shared/constants/routes';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName, cn } from '@pramana/ui-components';

/**
 * SS6: one component, three shapes.
 *   under 640px  - a bottom tab bar, thumb-reachable
 *   640-1023px   - a horizontal strip under the header
 *   1024px and up - a persistent side rail
 * The shape changes; the items and their order never do.
 */
const ITEMS: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: ROUTES.doctor.prescribe, label: 'New prescription', icon: 'plus' },
  { to: ROUTES.doctor.prescriptions, label: 'History', icon: 'file' },
  { to: ROUTES.doctor.status, label: 'Verification', icon: 'shieldCheck' },
  { to: ROUTES.doctor.onboarding, label: 'Set-up', icon: 'key' },
];

export function Sidebar() {
  return (
    <nav
      aria-label="Doctor portal sections"
      className={cn(
        'scroll-none bg-canvas',
        // phone: fixed bottom tab bar
        'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-50 max-sm:flex max-sm:overflow-x-auto',
        'max-sm:border-t max-sm:border-line max-sm:pb-[env(safe-area-inset-bottom)]',
        // tablet: horizontal strip
        'sm:sticky sm:top-[56px] sm:z-30 sm:flex sm:gap-1 sm:overflow-x-auto sm:border-b sm:border-line-2 sm:px-4 sm:py-2',
        // desktop: side rail
        'lg:h-[calc(100dvh-56px)] lg:flex-col lg:gap-1 lg:border-b-0 lg:border-r lg:border-line-2 lg:px-3 lg:py-3',
      )}
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex min-h-touch items-center gap-3 rounded-control px-3 text-body-sm font-medium no-underline',
              'whitespace-nowrap transition-colors duration-instant ease-out',
              'max-sm:flex-1 max-sm:shrink-0 max-sm:flex-col max-sm:justify-center max-sm:gap-1 max-sm:px-3 max-sm:text-caption',
              isActive
                ? 'text-seal sm:bg-seal-wash'
                : 'text-ink-3 hover:bg-canvas-2 hover:text-ink',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {/* SS1.1: the active-state indicator is one of the four places
                  oxblood is allowed. It is colour AND position, never colour alone. */}
              {isActive ? (
                <span aria-hidden className="ml-auto hidden h-5 w-[3px] rounded-full bg-seal lg:block" />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
