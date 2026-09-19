import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Icon, type IconName } from '../Icon/Icon';

/**
 * SS5: InlineNotice and Toast are two physical forms of the same semantic
 * content. Use InlineNotice for anything the user must read BEFORE proceeding -
 * interaction warnings, consent explanations, irreversible-action context.
 * Never use a dismissible toast for anything that carries a decision.
 */
export type NoticeTone = 'neutral' | 'tourmaline' | 'amber' | 'scarlet' | 'seal';

const TONE: Record<NoticeTone, { className: string; icon: IconName }> = {
  neutral: { className: 'border-l-ink-3 bg-canvas-2 text-ink', icon: 'file' },
  tourmaline: { className: 'border-l-tourmaline bg-tourmaline-wash text-tourmaline', icon: 'shieldCheck' },
  amber: { className: 'border-l-amber bg-amber-wash text-amber', icon: 'alertTriangle' },
  scarlet: { className: 'border-l-scarlet bg-scarlet-wash text-scarlet', icon: 'ban' },
  seal: { className: 'border-l-seal bg-seal-wash text-seal', icon: 'lock' },
};

export function InlineNotice({
  tone = 'neutral', title, children, icon, className, role,
}: {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
  icon?: IconName;
  className?: string;
  /** Use "alert" only when the notice appears in response to an action. */
  role?: 'alert' | 'status' | 'note';
}) {
  const meta = TONE[tone];
  return (
    <div
      role={role === 'note' ? undefined : role}
      className={cn('flex gap-3 rounded-control border-l-[3px] p-4', meta.className, className)}
    >
      <Icon name={icon ?? meta.icon} size={18} className="mt-px" />
      <div className="flex flex-col gap-1 text-body-sm">
        {title ? <strong className="font-semibold">{title}</strong> : null}
        <div className="max-w-measure">{children}</div>
      </div>
    </div>
  );
}
