import { useMemo } from 'react';
import { cn } from '../lib/cn';

/**
 * The logomark and the signing seal are one component (SS5). It is the only
 * bespoke graphic element in the entire system (SS4) - nothing else in the
 * product is illustrated, so this must not compete with anything.
 *
 * mode:
 *   'mark'  - static logomark in the header, favicons, empty states
 *   'stamp' - the SS7.2 signing moment: scales in from 2.4x with a slight
 *             rotation settling at -6deg, on ease-seal
 */
function scallopPath(bumps: number, radius: number, cx: number, cy: number): string {
  const n = bumps * 2;
  const points: Array<[number, number]> = [];
  for (let i = 0; i < n; i += 1) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? radius : radius * 0.885;
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  const start = mid(points[n - 1]!, points[0]!);
  let d = `M${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
  for (let i = 0; i < n; i += 1) {
    const control = points[i]!;
    const end = mid(control, points[(i + 1) % n]!);
    d += ` Q${control[0].toFixed(2)} ${control[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

export function SealMark({
  size = 32, mode = 'mark', className, title,
}: {
  size?: number;
  mode?: 'mark' | 'stamp';
  className?: string;
  title?: string;
}) {
  const d = useMemo(() => scallopPath(17, 46, 50, 50), []);
  const label = title ?? (mode === 'stamp' ? 'Sealed' : 'Pramana');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      className={cn('text-seal', mode === 'stamp' && 'seal-stamp', className)}
    >
      <title>{label}</title>
      <path d={d} fill="currentColor" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="var(--surface)" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle
        cx="50" cy="50" r="31" fill="none"
        stroke="var(--surface)" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="2.5 4"
      />
      {/* Stamped monogram: the P of Pramana, cut as a die would cut it. */}
      <path
        d="M42 62V38h9.5a7.5 7.5 0 010 15H42"
        fill="none" stroke="var(--surface)" strokeWidth="4.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M50 66.5h11" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
