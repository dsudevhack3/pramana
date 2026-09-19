import { cn } from '../lib/cn';

/**
 * SS5: renders as discrete filled segments, never a continuous percentage bar.
 * A multi-step legal or identity process should never look like a download.
 *
 * SS6/SS7.3: horizontal for mobile and compact contexts, vertical in the wide
 * onboarding layout, where it becomes a fixed side panel. When a step
 * completes, its segment (or, vertically, its connector) fills 0 to 100% over
 * DUR.fill on EASE.smooth before the next segment becomes current.
 */
export interface Step {
  id: string;
  label: string;
  /** Optional one-line hint shown under the label in the vertical layout. */
  hint?: string;
}

export function StepperProgress({
  steps, current, orientation = 'horizontal', className, label = 'Progress',
}: {
  steps: Step[];
  /** Zero-based index of the step in progress. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}) {
  const vertical = orientation === 'vertical';

  return (
    <ol
      aria-label={label}
      className={cn('flex', vertical ? 'flex-col' : 'gap-2', className)}
    >
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        const filled = state !== 'todo';

        return (
          <li
            key={step.id}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn(
              vertical ? 'grid min-h-[56px] grid-cols-[4px_1fr] items-stretch gap-3' : 'min-w-0 flex-1',
            )}
          >
            <div
              className={cn(
                'overflow-hidden rounded-full bg-canvas-2',
                vertical ? 'w-1' : 'h-1',
              )}
            >
              <div
                className={cn(
                  'transition-[width,height] duration-fill ease-smooth',
                  state === 'current' ? 'bg-seal' : 'bg-ink',
                  vertical ? 'w-full' : 'h-full',
                  vertical
                    ? filled ? 'h-full' : 'h-0'
                    : filled ? 'w-full' : 'w-0',
                )}
              />
            </div>

            <div className={cn(vertical ? 'pb-5' : 'mt-2')}>
              <span
                className={cn(
                  'block',
                  vertical ? 'text-body-sm' : 'text-caption',
                  state === 'current' && 'font-semibold text-seal',
                  state === 'done' && 'text-ink-3',
                  state === 'todo' && 'text-muted',
                )}
              >
                {step.label}
              </span>
              {vertical && step.hint ? (
                <span className="mt-1 block max-w-measure text-caption text-muted">{step.hint}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
