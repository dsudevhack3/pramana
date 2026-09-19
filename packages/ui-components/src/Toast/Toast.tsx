import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { Icon, type IconName } from '../Icon/Icon';

/**
 * SS5: Toast is for TRANSIENT CONFIRMATIONS only. If the user must read it
 * before proceeding, or it carries a decision, it is an <InlineNotice />
 * instead. That rule is why this API has no "action" or "undo" prop.
 *
 * SS9: a toast repeats the verb of the action that produced it - "Sign and
 * seal" resolves to "Sealed", never a generic "Success".
 */
interface ToastItem {
  id: number;
  message: string;
  icon: IconName;
}

const ToastContext = createContext<{ show: (message: string, icon?: IconName) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, icon: IconName = 'check') => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur, { id, message, icon }]);
    window.setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className={cn(
            'pointer-events-none fixed z-[60] flex flex-col gap-2',
            'bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 w-[min(420px,calc(100vw-24px))] -translate-x-1/2',
            'lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0',
          )}
        >
          {items.map((t) => (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-control bg-ink px-4 py-3',
                'text-body-sm text-canvas',
                'motion-safe:animate-[pramana-field-in_var(--dur-quick)_var(--ease-out)]',
              )}
            >
              <Icon name={t.icon} size={17} />
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}
